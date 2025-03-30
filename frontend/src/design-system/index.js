// src/design-system/index.js
// Exporte apenas os componentes que você realmente criou

// Componentes de Botões
export { default as Button } from './components/buttons/Button';
export { default as IconButton } from './components/buttons/IconButton';

// Componentes de Cards
export { default as Card } from './components/cards/Card';
export { default as FlowCard } from './components/cards/FlowCard';
export { default as AnalyticsCard } from './components/cards/AnalyticsCard';
export { default as PlanCard } from './components/cards/PlanCard';

// Componentes de Navegação
export { default as Sidebar } from './components/navigation/Sidebar';
export { default as Navbar } from './components/navigation/Navbar';
export { default as Breadcrumbs } from './components/navigation/Breadcrumbs';

// Componentes de Formulário
export { default as TextField } from './components/forms/TextField';
export { default as Select } from './components/forms/Select';
export { default as Checkbox } from './components/forms/Checkbox';
export { default as RadioGroup } from './components/forms/RadioGroup';

// Componentes de Layout
export { default as Container } from './components/layout/Container';
export { default as Grid } from './components/layout/Grid';
// Importe o MainLayout
export { default as MainLayout } from '../layout/MainLayout';

// Remova ou comente qualquer componente que ainda não foi criado
// export { default as Alert } from './components/feedback/Alert';
// export { default as Toast } from './components/feedback/Toast';
// export { default as Loader } from './components/feedback/Loader';