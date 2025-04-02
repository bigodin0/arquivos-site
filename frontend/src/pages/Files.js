import React, { useState, useEffect } from 'react';
import { MainLayout, Container, Grid, Card, Button } from '../design-system';
import { Upload, File, Image, Trash2, Plus } from 'lucide-react';
import FileStorageService from '../services/fileStorage';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFiles();
  }, []);
  
  const loadFiles = async () => {
    setLoading(true);
    const filesData = FileStorageService.getFilesMetadata();
    setFiles(filesData);
    setLoading(false);
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await FileStorageService.saveFile(file);
      loadFiles();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Falha ao fazer upload do arquivo");
    }
  };
  
  const handleDelete = async (fileId) => {
    if (window.confirm("Tem certeza que deseja excluir este arquivo?")) {
      FileStorageService.deleteFile(fileId);
      loadFiles();
    }
  };
  
  return (
    <MainLayout title="Arquivos">
      <Container>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meus Arquivos</h1>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button 
              variant="primary"
              icon={<Upload size={18} />}
            >
              Fazer Upload
            </Button>
          </label>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Carregando arquivos...</div>
        ) : files.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">Você ainda não possui arquivos</p>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button 
                variant="outline"
                icon={<Plus size={18} />}
              >
                Adicionar Arquivo
              </Button>
            </label>
          </Card>
        ) : (
          <Grid cols={1} md={2} lg={3} gap={4}>
            {files.map(file => (
              <Card key={file.id} className="p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                    {file.type.startsWith('image/') ? (
                      <Image size={20} className="text-primary" />
                    ) : (
                      <File size={20} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{file.name}</h3>
                    <p className="text-xs text-gray-500">{FileStorageService.formatFileSize(file.size)}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </Grid>
        )}
      </Container>
    </MainLayout>
  );
};

export default Files;