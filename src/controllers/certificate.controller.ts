import { type Request, type Response } from "express";
import { getCertificates, genKeysByServer, revokeCertificate, reqCertByCSR } from "../services/certificate.service";
import { uploadToStorage } from "../services/storage.service";
import { errorHandler } from "../config/axios.config";
import { defaultUser, User } from "../models/user.model";

export const genKeysByServerController = async (req: Request, res: Response) => {
  //  #swagger.tags=['certificate']
  //  #swagger.parameters['body'] = {in: "body", schema: { $ref: "#/schemas/CertificateEnrollRequest" }}
  const { preferred_username, name } = req.authuser;
  const { passphrase }: { passphrase: string } = req.body;
  
  try {
    const user: User = {
      ...defaultUser, passphrase,
      username: preferred_username,
      email: preferred_username,
      cn: name
    }

    const p12File: Buffer = await genKeysByServer(user);

    // Save binary data to a .p12 file
    uploadToStorage(`${preferred_username}/${preferred_username}.p12`, p12File);

    res.status(200).send({'message': `Certificate saved as ${preferred_username}/${preferred_username}.p12`});
  }catch (error: any) {
    const {message, error_code} = errorHandler(error);
    res.status(error_code).send({ message: message });
  }
};

export const getCertificatesController = async (req: Request<{},{},{}, { status: string}>, res: Response) => {
  //  #swagger.tags=['certificate']
  const { status } = req.query;
  const { preferred_username } = req.authuser;
  try {
    const body = await getCertificates(preferred_username, status);
    res.status(200).send(body);
  }catch (error: any) {
    const {message, error_code} = errorHandler(error);
    res.status(error_code).send({ message: message });
  }
};

export const revokeCertificateController = async (req: Request, res: Response) => {
  //  #swagger.tags=['certificate']
  //  #swagger.parameters['body'] = {in: "body", schema: { $ref: "#/schemas/CertificateRevokeRequest" }}
  const { serial_number, issuer_dn, revocation_reason } = req.body;
  try {
    const body = await revokeCertificate(serial_number, issuer_dn, revocation_reason);
    res.status(200).send(body);
  }catch (error: any) {
    const {message, error_code} = errorHandler(error);
    res.status(error_code).send({ message: message });
  }
};

export const reqCertByCSRController = async (req: Request, res: Response) => {
  //  #swagger.tags=['certificate']
  //  #swagger.parameters['body'] = {in: "body", schema: { $ref: "#/schemas/CertificateCSRRequest" }}
  const { preferred_username } = req.authuser;
  const { passphrase, csr }: { passphrase: string, csr:string } = req.body;
  
  try {
    const user: User = {
      ...defaultUser, passphrase,
      username: preferred_username,
      email: preferred_username
    }

    const signCert: string = await reqCertByCSR(user, csr);
    res.status(200).send({
      'certificate': signCert,
      'message': `Certificate creation success`});
  }catch (error: any) {
    const {message, error_code} = errorHandler(error);
    res.status(error_code).send({ message: message });
  }
};