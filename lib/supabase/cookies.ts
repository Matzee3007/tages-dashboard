// HttpOnly geht, weil nur der Server Cookies liest und schreibt (kein Browser-Client).
export const SUPABASE_COOKIE_OPTIONEN = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
