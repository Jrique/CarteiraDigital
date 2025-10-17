export interface Categoria {
  id: string;
  nome: string;
  icone: any;
  cor: string;
}

export const CATEGORIAS_RECEITA: Categoria[] = [
  { id: 'salario', nome: 'Salário', icone: 'cash-outline', cor: '#27ae60' },
  { id: 'freelance', nome: 'Freelance', icone: 'briefcase-outline', cor: '#2980b9' },
  { id: 'investimentos', nome: 'Investimentos', icone: 'trending-up-outline', cor: '#8e44ad' },
  { id: 'vendas', nome: 'Vendas', icone: 'pricetag-outline', cor: '#f39c12' },
  { id: 'premios', nome: 'Prêmios', icone: 'trophy-outline', cor: '#f1c40f' },
  { id: 'presentes', nome: 'Presentes', icone: 'gift-outline', cor: '#1abc9c' },
  { id: 'outros', nome: 'Outros', icone: 'ellipse-outline', cor: '#95a5a6' }
];

export const CATEGORIAS_DESPESA: Categoria[] = [
  { id: 'alimentacao', nome: 'Alimentação', icone: 'restaurant-outline', cor: '#e74c3c' },
  { id: 'transporte', nome: 'Transporte', icone: 'bus-outline', cor: '#3498db' },
  { id: 'pessoal', nome: 'Pessoal', icone: 'person-outline', cor: '#9b59b6' },
  { id: 'mantimentos', nome: 'Mantimentos', icone: 'cart-outline', cor: '#f1c40f' },
  { id: 'moradia', nome: 'Moradia', icone: 'home-outline', cor: '#1abc9c' },
  { id: 'saude', nome: 'Saúde', icone: 'medkit-outline', cor: '#e67e22' },
  { id: 'educacao', nome: 'Educação', icone: 'school-outline', cor: '#34495e' },
  { id: 'lazer', nome: 'Lazer', icone: 'game-controller-outline', cor: '#d35400' },
  { id: 'roupas', nome: 'Roupas', icone: 'shirt-outline', cor: '#c0392b' },
  { id: 'tecnologia', nome: 'Tecnologia', icone: 'laptop-outline', cor: '#2980b9' },
  { id: 'outros', nome: 'Outros', icone: 'ellipse-outline', cor: '#7f8c8d' }
];

export const obterCategoriasPorTipo = (tipo: 'receita' | 'despesa') => {
  return tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
};