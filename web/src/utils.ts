import axios from "axios";

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export default function getAxiosErrorMessage(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): string {
  console.error("Error occurred:", error);

  if (axios.isAxiosError<string>(error)) {
    const axiosError = error;

    if (axiosError.response && isString(axiosError.response.data)) {
      return axiosError.response.data;
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  return fallbackMessage;
}
