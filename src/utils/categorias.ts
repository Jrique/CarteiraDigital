export const CATEGORIAS_RECEITA = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Prêmios',
  'Presentes',
  'Outros'
];

export const CATEGORIAS_DESPESA = [
  'Alimentação',
  'Transporte',
  'Pessoal',
  'Mantimentos',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Tecnologia',
  'Outros'
];

export const obterCategoriasPorTipo = (tipo: 'receita' | 'despesa') => {
  return tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
};

