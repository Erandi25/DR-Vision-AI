import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const predictImage = async (file) => {

  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/predict`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};