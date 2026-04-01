import axios from 'axios';

const BASE = 'http://localhost:3001/api/location';

function normalize(item) {
  // API trả về code là integer, cần convert sang string
  const code = item?.code ?? '';
  const name = item?.name ?? '';
  return { code: String(code), name: String(name) };
}

export async function getProvinces() {
  const res = await axios.get(`${BASE}/provinces`);
  return res.data.map(normalize);
}

export async function getDistricts(provinceId) {
  const res = await axios.get(`${BASE}/districts`, {
    params: { p: provinceId }
  });
  return res.data.map(normalize);
}

export async function getWards(districtId) {
  const res = await axios.get(`${BASE}/wards`, {
    params: { d: districtId }
  });
  return res.data.map(normalize);
}

export default {
  getProvinces,
  getDistricts,
  getWards,
};