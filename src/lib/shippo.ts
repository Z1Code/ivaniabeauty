import { Shippo } from "shippo";

let _shippo: Shippo | null = null;

export function getShippo(): Shippo {
  if (!_shippo) {
    const key = process.env.SHIPPO_API_KEY;
    if (!key) {
      throw new Error("SHIPPO_API_KEY is not set in environment variables");
    }
    _shippo = new Shippo({
      apiKeyHeader: key,
      shippoApiVersion: "2018-02-08",
    });
  }
  return _shippo;
}

export const STORE_ADDRESS = {
  name: "Ivania Beauty",
  street1: "2827 Riders Ct",
  city: "Dacula",
  state: "GA",
  zip: "30019-2192",
  country: "US",
  email: process.env.STORE_EMAIL || "",
  phone: process.env.STORE_PHONE || "",
};
