import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayloadUtilisateur } from "../types/authentification.types";

const NOMBRE_SALT = 10;

export const hacherMotDePasse = async (mdp: string): Promise<string> => bcrypt.hash(mdp, NOMBRE_SALT);

export const comparerMotDePasse = async (mdp: string, mdpHache: string): Promise<boolean> =>
  bcrypt.compare(mdp, mdpHache);

export const genererJwt = (payload: JwtPayloadUtilisateur): string => jwt.sign(payload, env.jwtSecret, { expiresIn: "1d" });

export const verifierJwt = (token: string): JwtPayloadUtilisateur =>
  jwt.verify(token, env.jwtSecret) as JwtPayloadUtilisateur;
