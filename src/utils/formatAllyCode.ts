/**
 * Format ally code for display as ###-###-###
 */
export const formatAllyCode = (allyCode: string): string => {
  if (!allyCode || allyCode.length !== 9) {
    return allyCode;
  }
  return `${allyCode.slice(0, 3)}-${allyCode.slice(3, 6)}-${allyCode.slice(6, 9)}`;
};

/**
 * Remove formatting from ally code (###-###-### -> #########)
 */
export const unformatAllyCode = (formatted: string): string => {
  return formatted.replace(/-/g, '');
};
