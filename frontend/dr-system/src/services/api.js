import axios from "axios";

const API_URL =
  "https://erandi25-dr-vision-ai.hf.space";

export const predictImage = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/predict`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};