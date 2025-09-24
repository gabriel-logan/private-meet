export default function observer(callback: () => void): MutationObserver {
  const observer = new MutationObserver(() => {
    callback();
  });

  return observer;
}
