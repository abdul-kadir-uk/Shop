export const generateSlug = (text) => {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now()
  );
};
