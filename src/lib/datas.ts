export function formatarData(valor?: string | null) {
  if (!valor) return "Não registrada";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Não registrada";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
