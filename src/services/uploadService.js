import api from './api';

export async function uploadFile(file, folder = 'general') {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/upload?folder=restora/${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
