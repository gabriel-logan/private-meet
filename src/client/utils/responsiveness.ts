export const isMobile = (): boolean => {
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const uaMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry/i.test(
    navigator.userAgent,
  );
  return coarse || uaMobile;
};
