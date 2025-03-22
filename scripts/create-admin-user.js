const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Substitua com suas credenciais de conexão do MongoDB
const MONGODB_URI = 'mongodb+srv://simulachat@admin:<simulachat>@simulachat.eozqb.mongodb.net/?retryWrites=true&w=majority&appName=simulachat';

// Modelo de Usuário (certifique-se de que corresponda ao seu esquema atual)
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'user',
    enum: ['user', 'admin'] 
  }
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conexão com o MongoDB estabelecida com sucesso.');

    // Dados do usuário admin
    const adminEmail = 'admin@simulachat.com';
    const adminPassword = 'Csc@022325!';

    // Verificar se o usuário admin já existe
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Usuário admin já existe. Atualizando papel para admin...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Papel do usuário atualizado para admin com sucesso.');
    } else {
      // Criar novo usuário admin
      // Gerar hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Criar novo usuário
      const newAdminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      // Salvar usuário
      await newAdminUser.save();
      console.log('Usuário admin criado com sucesso!');
    }

    // Fechar conexão
    await mongoose.connection.close();
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    
    // Tentar fechar a conexão em caso de erro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Executar a função para criar usuário admin
createAdminUser();