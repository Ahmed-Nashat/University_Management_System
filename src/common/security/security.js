import bcrypt from "bcrypt";

export const hashing = async (plainText) => {
  return await bcrypt.hash(plainText, 10);
};

export const comparing = async ({ plainText, cipherText }) => {
  return await bcrypt.compare(plainText, cipherText);
};
