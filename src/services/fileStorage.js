// Sistema de armazenamento de arquivos (simulação usando localStorage)
const FileStorageService = {
    // Salvar um arquivo (como base64)
    saveFile: (file, fileName) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = () => {
          try {
            // Em uma implementação real, você enviaria isso para um servidor
            const fileId = `file_${Date.now()}`;
            localStorage.setItem(fileId, reader.result);
            
            const fileInfo = {
              id: fileId,
              name: fileName || file.name,
              type: file.type,
              size: file.size,
              url: reader.result,
              uploadedAt: new Date().toISOString()
            };
            
            // Salvar metadados do arquivo
            const filesMetadata = FileStorageService.getFilesMetadata();
            filesMetadata.push(fileInfo);
            localStorage.setItem('simulachat_files', JSON.stringify(filesMetadata));
            
            resolve(fileInfo);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
      });
    },
    
    // Obter um arquivo pelo ID
    getFile: (fileId) => {
      const file = localStorage.getItem(fileId);
      if (!file) return null;
      
      const filesMetadata = FileStorageService.getFilesMetadata();
      const metadata = filesMetadata.find(f => f.id === fileId);
      
      return {
        ...metadata,
        url: file
      };
    },
    
    // Obter todos os metadados de arquivos
    getFilesMetadata: () => {
      const metadata = localStorage.getItem('simulachat_files');
      return metadata ? JSON.parse(metadata) : [];
    },
    
    // Excluir um arquivo
    deleteFile: (fileId) => {
      localStorage.removeItem(fileId);
      
      const filesMetadata = FileStorageService.getFilesMetadata();
      const updatedMetadata = filesMetadata.filter(f => f.id !== fileId);
      localStorage.setItem('simulachat_files', JSON.stringify(updatedMetadata));
      
      return updatedMetadata;
    },
    
    // Limitar o tamanho do arquivo (em bytes)
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Verificar se um arquivo é válido (tamanho e tipo)
    validateFile: (file, allowedTypes = []) => {
      if (file.size > FileStorageService.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `O arquivo é muito grande. Tamanho máximo permitido: 5MB.`
        };
      }
      
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
        };
      }
      
      return { valid: true };
    },
    
    // Obter estatísticas de armazenamento
    getStorageStats: () => {
      const filesMetadata = FileStorageService.getFilesMetadata();
      const totalFiles = filesMetadata.length;
      const totalSize = filesMetadata.reduce((acc, file) => acc + (file.size || 0), 0);
      
      return {
        totalFiles,
        totalSize,
        totalSizeFormatted: FileStorageService.formatFileSize(totalSize)
      };
    },
    
    // Formatar tamanho do arquivo para exibição
    formatFileSize: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Gerar URL de compartilhamento (simulado)
    generateShareableUrl: (fileId) => {
      // Em uma implementação real, isso geraria uma URL genuína
      return `https://simulachat.app/file/${fileId}`;
    },
    
    // Obter arquivos por tipo
    getFilesByType: (type) => {
      const filesMetadata = FileStorageService.getFilesMetadata();
      return filesMetadata.filter(file => file.type.startsWith(type));
    },
    
    // Obter arquivos de imagem
    getImageFiles: () => {
      return FileStorageService.getFilesByType('image/');
    },
    
    // Buscar arquivos por nome
    searchFiles: (query) => {
      if (!query) return [];
      
      const filesMetadata = FileStorageService.getFilesMetadata();
      const lowercaseQuery = query.toLowerCase();
      
      return filesMetadata.filter(file => 
        file.name.toLowerCase().includes(lowercaseQuery)
      );
    }
  };
  
  export default FileStorageService;