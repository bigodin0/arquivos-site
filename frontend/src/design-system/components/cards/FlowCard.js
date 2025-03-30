import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  ArrowUpRight, 
  MessageSquare, 
  Share2, 
  Copy, 
  Eye, 
  Trash, 
  MoreVertical
} from 'lucide-react';

// Função auxiliar para formatar a data corretamente
const formatDate = (dateString) => {
  try {
    // Verificar se é uma data válida
    if (!dateString) return 'Data indisponível';
    
    // Se for uma string em formato de data válido, convertemos
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      // Se for um formato brasileiro (DD/MM/YYYY)
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString; // Retornar a string original
      }
      return 'Data indisponível';
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return 'Data indisponível';
  }
};

const FlowCard = ({ 
  id, 
  title, 
  description, 
  messageCount, 
  createdAt, 
  updatedAt,
  platform,
  link,
  onShare,
  onDelete,
  onDuplicate,
  onPreview
}) => {
  // Manipular o clique nos ícones sem propagar para o card inteiro
  const handleActionClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      {/* Conteúdo principal do card (clicável) */}
      <Link to={`/flow/${id}`} className="block">
        <div className="p-5">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded">
              {platform || 'WhatsApp'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
          
          {/* Estatísticas */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare size={16} className="mr-2 text-teal-600" />
              <span>{messageCount || 0} mensagens no fluxo</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Calendar size={16} className="mr-2 text-teal-600" />
              <span>Criado em {formatDate(createdAt)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <ArrowUpRight size={16} className="mr-2 text-teal-600" />
              <span>Atualizado em {formatDate(updatedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Barra de ações (separada do link principal) */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Link do Fluxo</span>
          </div>
          
          <div className="flex items-center">
            {/* Botões de ação - cada um em seu próprio elemento clicável */}
            {onShare && (
              <button 
                onClick={(e) => handleActionClick(e, onShare)}
                className="mr-3 text-text-medium hover:text-primary transition-colors"
                title="Copiar link de compartilhamento"
              >
                <Share2 size={16} />
              </button>
            )}
            
            {onPreview && (
              <button 
                onClick={(e) => handleActionClick(e, onPreview)}
                className="mr-3 text-text-medium hover:text-primary transition-colors"
                title="Visualizar fluxo"
              >
                <Eye size={16} />
              </button>
            )}
            
            {onDuplicate && (
              <button 
                onClick={(e) => handleActionClick(e, onDuplicate)}
                className="mr-3 text-text-medium hover:text-primary transition-colors"
                title="Duplicar fluxo"
              >
                <Copy size={16} />
              </button>
            )}
            
            {onDelete && (
              <button 
                onClick={(e) => handleActionClick(e, onDelete)}
                className="text-rose-500 hover:text-rose-600 transition-colors"
                title="Excluir fluxo"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowCard;