import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, FileText, MessageSquare, Send, CheckCircle, 
  Upload, Plus, Download, User, Building2, Phone, 
  Check, ArrowLeft, Eye, EyeOff, Save,
  CalendarDays, Paperclip, Search, RotateCcw, Trash2, Filter, AlertCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// =========================================================
// CONEXÃO DE BANCO DE DADOS SUPABASE
// =========================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// LOGO MEDTECH BM COM CONTAINER BRANCO OPCIONAL
function MedTechLogo({ isLarge = false, forceWhiteBg = false }) {
  return (
    <div className={`flex items-center justify-center ${forceWhiteBg ? 'bg-white px-3 py-1 rounded-lg shadow-sm' : ''}`}>
      <img 
        src="/logo.jpeg" 
        alt="MedTech BM Logo" 
        className={`${isLarge ? 'h-24 sm:h-32' : 'h-8 sm:h-10'} w-auto object-contain drop-shadow-sm transition-all duration-300`}
      />
    </div>
  );
}

// FORMATADOR DE DATA BRASILEIRO (DD/MM/AAAA)
function formatarDataBR(dataIsoOuDate) {
  if (!dataIsoOuDate) return '';
  if (typeof dataIsoOuDate === 'string' && dataIsoOuDate.includes('/')) return dataIsoOuDate;
  
  const d = new Date(dataIsoOuDate);
  if (isNaN(d.getTime())) {
    const partes = dataIsoOuDate.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataIsoOuDate;
  }
  
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// LISTAS DE REFERÊNCIA MUNICIPAIS
const ESPECIALIDADES_CONSULTA = [
  'Clínica Geral', 'Pediatria', 'Ginecologia e Obstetrícia', 'Cardiologia', 
  'Dermatologia', 'Ortopedia', 'Oftalmologia', 'Neurologia', 
  'Endocrinologia', 'Psiquiatria', 'Odontologia / Dentista', 'Nutrição'
];

const TIPOS_EXAMES = [
  'Hemograma Completo', 'Glicemia em Jejum', 'Colesterol e Triglicérides', 
  'Exame de Urina (EAS)', 'Parasitológico de Fezes', 'Raio-X de Tórax', 
  'Raio-X Odontológico', 'Ultrassonografia Abdominal', 'Ultrassonografia Pélvica', 
  'Eletrocardiograma (ECG)', 'Ecocardiograma', 'Mamografia', 'Tomografia Computadorizada'
];

const UNIDADES_SAUDE = [
  'UBS Centro - Barra Mansa',
  'UBS Ano Bom - Barra Mansa',
  'UBS Vila Maria - Barra Mansa',
  'UBS Santa Rosa - Barra Mansa',
  'UPA 24h - Barra Mansa',
  'Santa Casa de Misericórdia - BM'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // null, 'citizen', 'admin'
  const [selectedProfile, setSelectedProfile] = useState(null); // null, 'citizen', 'admin'
  const [authMode, setAuthMode] = useState('login');
  const [currentTab, setCurrentTab] = useState('solicitar');

  // CONTROLE VISUAL DE SENHA
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ESTADOS MANTIDOS EM MEMÓRIA E SUPABASE
  const [dbCidadaos, setDbCidadaos] = useState([]);
  const [dbPostos, setDbPostos] = useState([
    { unidade: 'UBS Centro - Barra Mansa', usuario: 'admin.centro', senha: '123' },
    { unidade: 'UBS Ano Bom - Barra Mansa', usuario: 'admin.anobom', senha: '123' }
  ]);

  // GRADES DE HORÁRIOS DISPONÍVEIS
  const [gradesDisponiveis, setGradesDisponiveis] = useState([
    { id: 1, posto: 'UBS Centro - Barra Mansa', categoria: 'Consulta', especialidade: 'Pediatria', medico: 'Dra. Ana Costa', data: '2026-11-01', horario: '08:30', vagas: 4 },
    { id: 2, posto: 'UBS Centro - Barra Mansa', categoria: 'Exame', especialidade: 'Hemograma Completo', medico: 'Dr. Roberto Lima', data: '2026-11-10', horario: '09:00', vagas: 8 },
    { id: 3, posto: 'UBS Ano Bom - Barra Mansa', categoria: 'Consulta', especialidade: 'Cardiologia', medico: 'Dr. Gabriel', data: '2026-11-25', horario: '14:00', vagas: 10 }
  ]);

  // AGENDAMENTOS E SOLICITAÇÕES
  const [agendamentos, setAgendamentos] = useState([]);

  // EXAMES PUBLICADOS
  const [exames, setExames] = useState([]);

  // CHAT DAS MENSAGENS
  const [mensagensChat, setMensagensChat] = useState([]);
  const [usuarioChatSelecionadoPosto, setUsuarioChatSelecionadoPosto] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // MODAIS E FILTROS
  const [filtroDataAgenda, setFiltroDataAgenda] = useState('');
  const [modalWppAutoOpen, setModalWppAutoOpen] = useState(false);
  const [mensagemWppAuto, setMensagemWppAuto] = useState('');

  // FILTROS DA GESTÃO DE GRADE DO POSTO
  const [filtroGradeEspecialidade, setFiltroGradeEspecialidade] = useState('');
  const [filtroGradeMedico, setFiltroGradeMedico] = useState('');
  const [filtroGradeData, setFiltroGradeData] = useState('');

  const [modalMotivoOpen, setModalMotivoOpen] = useState(false);
  const [agendamentoNaoConcluidoId, setAgendamentoNaoConcluidoId] = useState(null);
  const [textoMotivoNaoConcluido, setTextoMotivoNaoConcluido] = useState('');

  const [modalRecusaOpen, setModalRecusaOpen] = useState(false);
  const [agendamentoRecusaId, setAgendamentoRecusaId] = useState(null);
  const [textoMotivoRecusa, setTextoMotivoRecusa] = useState('');

  const [modalDesistenciaOpen, setModalDesistenciaOpen] = useState(false);
  const [agendamentoDesistenciaId, setAgendamentoDesistenciaId] = useState(null);
  const [textoDesistencia, setTextoDesistencia] = useState('');

  // FORMULÁRIOS DE ENTRADA
  const [formCitizen, setFormCitizen] = useState({ nome: '', cpf: '', cartaoSus: '', email: '', telefone: '', notificacaoPref: 'whatsapp', senha: '', lgpdAceite: false });
  const [formAdmin, setFormAdmin] = useState({ unidade: UNIDADES_SAUDE[0], usuario: '', senha: '', lgpdAceite: false });
  const [loggedUserData, setLoggedUserData] = useState(null);

  // FORMULÁRIOS OPERACIONAIS
  const [solicitacao, setSolicitacao] = useState({ posto: UNIDADES_SAUDE[0], tipo: 'Consulta', especialidade: ESPECIALIDADES_CONSULTA[0], gradeIdSelecionada: '' });
  const [novoLaudo, setNovoLaudo] = useState({ cpf: '', tipoExame: TIPOS_EXAMES[0], arquivoAnexado: null });
  const [novaGrade, setNovaGrade] = useState({ categoria: 'Consulta', especialidade: ESPECIALIDADES_CONSULTA[0], medico: '', data: '', horario: '08:00', vagas: 10 });

  // CARREGAR DADOS DO SUPABASE
  useEffect(() => {
    fetchCidadaosSupabase();
    fetchAgendamentosSupabase();
  }, []);

  async function fetchCidadaosSupabase() {
    try {
      const { data } = await supabase.from('cidadaos').select('*');
      if (data) {
        const mapeados = data.map(c => ({
          nome: c.nome,
          cpf: c.cpf,
          cartaoSus: c.cartao_sus || c.cartaoSus,
          telefone: c.telefone,
          email: c.email,
          senha: c.senha || '123',
          notificacaoPref: c.notificacao_pref || 'whatsapp'
        }));
        setDbCidadaos(mapeados);
      }
    } catch (err) {
      console.error("Erro ao carregar cidadãos:", err);
    }
  }

  async function fetchAgendamentosSupabase() {
    try {
      const { data } = await supabase.from('agendamentos').select('*');
      if (data) {
        const mapeados = data.map(a => ({
          id: a.id,
          cidadao: a.nome_paciente || a.cidadao,
          cpf: a.cidadao_cpf || a.cpf,
          cartaoSus: a.cartao_sus || '700000000000000',
          telefone: a.telefone || '',
          email: a.email || '',
          tipo: a.tipo || 'Consulta',
          especialidade: a.exame_especialidade || a.especialidade,
          posto: a.posto_id ? UNIDADES_SAUDE[0] : (a.posto || UNIDADES_SAUDE[0]),
          data: a.data,
          horario: a.hora || a.horario || '08:00',
          status: a.status || 'Pendente',
          motivoRecusado: a.motivo_recusado || '',
          confirmacaoCidadao: a.confirmacao_cidadao || 'pendente',
          justificativaDesistencia: '',
          situacaoAtendimento: a.situacao_atendimento || 'pendente',
          motivoNaoConcluido: '',
          gradeId: a.grade_id || 1
        }));
        setAgendamentos(mapeados);
      }
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  }

  // DISPARADOR AUTOMÁTICO DE WHATSAPP
  const dispararNotificacaoStatus = (item, status, motivoRecusa = '') => {
    const dataBr = formatarDataBR(item.data);
    let msg = '';
    
    if (status === 'Aprovado') {
      msg = `[MEDTECH BM - MUNICIPAL]\nOlá ${item.cidadao}!\n\nSua solicitação de ${item.especialidade} foi APROVADA!\n\nLocal: ${item.posto}\nData/Hora: ${dataBr} às ${item.horario}h\nDocumentos: RG, CPF e Cartão SUS (${item.cartaoSus}).\n\nAcesse o portal MedTech BM para confirmar sua presença!`;
    } else {
      msg = `[MEDTECH BM - MUNICIPAL]\nOlá ${item.cidadao}.\nInfelizmente sua solicitação de ${item.especialidade} para o dia ${dataBr} foi RECUSADA pelo posto ${item.posto}.\n\nMotivo do Indeferimento: ${motivoRecusa}\n\nAcesse o site para escolher uma nova data.`;
    }

    setMensagemWppAuto(msg);
    setModalWppAutoOpen(true);

    if (item.telefone) {
      const tel = item.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  // LOGINS E REGISTROS PERSISTIDOS NO SUPABASE
  const handleLoginCitizen = (e) => {
    e.preventDefault();
    const user = dbCidadaos.find(u => u.cpf.trim() === formCitizen.cpf.trim());
    if (!user) return alert('CPF não cadastrado!');
    if (user.cartaoSus && user.cartaoSus.trim() !== formCitizen.cartaoSus.trim()) return alert('ERRO: Cartão SUS não corresponde ao CPF!');

    setLoggedUserData(user);
    setCurrentUser('citizen');
    setCurrentTab('solicitar');
  };

  const handleRegisterCitizen = async (e) => {
    e.preventDefault();
    if (!formCitizen.lgpdAceite) return alert('Aceite a LGPD para continuar.');
    
    try {
      const { error } = await supabase.from('cidadaos').insert([
        { 
          nome: formCitizen.nome, 
          cpf: formCitizen.cpf, 
          cartao_sus: formCitizen.cartaoSus, 
          telefone: formCitizen.telefone, 
          email: formCitizen.email || `${formCitizen.cpf}@medtech.bm`
        }
      ]);
      if (error) throw error;
      
      await fetchCidadaosSupabase();
      alert('Cadastro efetuado com sucesso no banco de dados! Efetue o login.');
      setAuthMode('login');
    } catch (err) {
      alert('Erro ao salvar no banco Supabase: ' + err.message);
    }
  };

  const handleLoginAdmin = (e) => {
    e.preventDefault();
    const posto = dbPostos.find(p => p.usuario.trim() === formAdmin.usuario.trim() && p.senha === formAdmin.senha);
    if (!posto) return alert('Credenciais inválidas para o posto!');

    setLoggedUserData(posto);
    setCurrentUser('admin');
    setCurrentTab('fila_admin');
  };

  const handleRegisterAdmin = (e) => {
    e.preventDefault();
    if (!formAdmin.lgpdAceite) return alert('Aceite os termos de segurança.');
    setDbPostos([...dbPostos, formAdmin]);
    alert('Posto cadastrado com sucesso!');
    setAuthMode('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfile(null);
    setLoggedUserData(null);
    setAuthMode('login');
  };

  // APROVAR / REPROVAR NO SUPABASE
  const handleAprovarSolicitacao = async (item) => {
    try {
      await supabase.from('agendamentos').update({ status: 'Aprovado' }).eq('id', item.id);
      setAgendamentos(agendamentos.map(a => a.id === item.id ? { ...a, status: 'Aprovado' } : a));
      dispararNotificacaoStatus(item, 'Aprovado');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModalRecusa = (id) => {
    setAgendamentoRecusaId(id);
    setTextoMotivoRecusa('');
    setModalRecusaOpen(true);
  };

  const handleConfirmarRecusa = async (e) => {
    e.preventDefault();
    if (!textoMotivoRecusa.trim()) return alert('Informe o motivo do indeferimento!');

    const itemRecusado = agendamentos.find(a => a.id === agendamentoRecusaId);
    
    try {
      await supabase.from('agendamentos').update({ status: 'Recusado' }).eq('id', agendamentoRecusaId);
      setAgendamentos(agendamentos.map(a => a.id === agendamentoRecusaId ? { ...a, status: 'Recusado', motivoRecusado: textoMotivoRecusa } : a));
      setModalRecusaOpen(false);
      dispararNotificacaoStatus(itemRecusado, 'Recusado', textoMotivoRecusa);
    } catch (err) {
      console.error(err);
    }
  };

  // CONFIRMAÇÃO E DESISTÊNCIA DO CIDADÃO
  const handleConfirmarPresencaCidadao = (id) => {
    setAgendamentos(agendamentos.map(a => a.id === id ? { ...a, confirmacaoCidadao: 'confirmado' } : a));
    alert('Sua presença foi CONFIRMADA!');
  };

  const handleOpenModalDesistencia = (id) => {
    setAgendamentoDesistenciaId(id);
    setTextoDesistencia('');
    setModalDesistenciaOpen(true);
  };

  const handleSalvarDesistencia = (e) => {
    e.preventDefault();
    if (!textoDesistencia.trim()) return alert('Informe a justificativa do cancelamento.');

    setAgendamentos(agendamentos.map(a => {
      if (a.id === agendamentoDesistenciaId) {
        return { 
          ...a, 
          confirmacaoCidadao: 'desistiu', 
          justificativaDesistencia: textoDesistencia, 
          status: 'Cancelado pelo Cidadão' 
        };
      }
      return a;
    }));

    setModalDesistenciaOpen(false);
    alert('Desistência registrada!');
  };

  // IA INTERATIVA DO CIDADÃO
  const handleOpcaoIA = (opcaoCodigo, textoPergunta) => {
    let respostaIa = '';
    const dataHoraAtual = `${formatarDataBR(new Date().toISOString().split('T')[0])} às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    switch(opcaoCodigo) {
      case 1:
        respostaIa = '🤖 **IA MedTech - Agendamentos**: Escolha o Posto de Saúde desejado no menu, selecione a especialidade e escolha um dos horários liberados.';
        break;
      case 2:
        respostaIa = '🤖 **IA MedTech - Laudos**: Na aba "Meus Exames", você encontra os laudos liberados para baixar em PDF.';
        break;
      case 3:
        respostaIa = '🤖 **IA MedTech - Horários UBS**: As UBSs atendem de segunda a sexta, das 07h às 17h. As UPAs funcionam 24h.';
        break;
      case 4:
        respostaIa = '🤖 **IA MedTech - Documentos**: Apresente RG, CPF, Comprovante de Residência e Cartão SUS.';
        break;
      default:
        respostaIa = '🤖 **IA MedTech**: Dúvida recebida. Para atendimento humano direto com a equipe da unidade escolhida, clique em "Falar com o Posto".';
    }

    setMensagensChat(prev => [
      ...prev,
      { id: Date.now(), cpf: loggedUserData.cpf, nomeCidadao: loggedUserData.nome, postoDestino: solicitacao.posto, remetente: loggedUserData.nome, texto: textoPergunta, dataHora: dataHoraAtual, lidaPeloPosto: true, solicitouHumano: false },
      { id: Date.now() + 1, cpf: loggedUserData.cpf, nomeCidadao: loggedUserData.nome, postoDestino: solicitacao.posto, remetente: 'Assistente IA MedTech', texto: respostaIa, dataHora: dataHoraAtual, lidaPeloPosto: true, solicitouHumano: false }
    ]);
  };

  const handleSolicitarAtendimentoHumano = () => {
    const dataHoraAtual = `${formatarDataBR(new Date().toISOString().split('T')[0])} às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const msgHumano = {
      id: Date.now(),
      cpf: loggedUserData.cpf,
      nomeCidadao: loggedUserData.nome,
      postoDestino: solicitacao.posto,
      remetente: loggedUserData.nome,
      texto: `⚠️ SOLICITAÇÃO: Solicito atendimento humano com a equipe da unidade [${solicitacao.posto}].`,
      dataHora: dataHoraAtual,
      lidaPeloPosto: false,
      solicitouHumano: true
    };

    setMensagensChat(prev => [...prev, msgHumano]);
    alert(`Sua conversa foi transferida para a fila de atendimento humano da unidade: ${solicitacao.posto}!`);
  };

  const handleToggleLidaPosto = (cpf, statusAtual) => {
    setMensagensChat(mensagensChat.map(m => (m.cpf === cpf && m.postoDestino === loggedUserData?.unidade) ? { ...m, lidaPeloPosto: !statusAtual } : m));
  };

  const handleSendChatPosto = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const dataHoraAtual = `${formatarDataBR(new Date().toISOString().split('T')[0])} às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const novaMsg = {
      id: Date.now(),
      cpf: usuarioChatSelecionadoPosto,
      nomeCidadao: dbCidadaos.find(c => c.cpf === usuarioChatSelecionadoPosto)?.nome || 'Cidadão',
      postoDestino: loggedUserData.unidade,
      remetente: `Equipe - ${loggedUserData.unidade}`,
      texto: chatInput,
      dataHora: dataHoraAtual,
      lidaPeloPosto: true,
      solicitouHumano: true
    };

    setMensagensChat(prev => prev.map(m => (m.cpf === usuarioChatSelecionadoPosto && m.postoDestino === loggedUserData.unidade) ? { ...m, lidaPeloPosto: true } : m).concat(novaMsg));
    setChatInput('');
  };

  const handleUpdatePerfil = (e) => {
    e.preventDefault();
    const atualizados = dbCidadaos.map(u => u.cpf === loggedUserData.cpf ? loggedUserData : u);
    setDbCidadaos(atualizados);
    alert('Perfil atualizado!');
  };

  const handleUploadLaudo = (e) => {
    e.preventDefault();
    if (!novoLaudo.cpf) return alert('Informe o CPF do paciente.');
    if (!novoLaudo.arquivoAnexado) return alert('ERRO: Anexe o PDF do exame antes de enviar!');

    const novo = {
      id: Date.now(),
      cpf: novoLaudo.cpf,
      data: formatarDataBR(new Date().toISOString().split('T')[0]),
      exame: novoLaudo.tipoExame,
      local: loggedUserData?.unidade,
      status: 'Pronto',
      arquivo: novoLaudo.arquivoAnexado.name
    };

    setExames([novo, ...exames]);
    alert('Laudo publicado com sucesso!');
    setNovoLaudo({ cpf: '', tipoExame: TIPOS_EXAMES[0], arquivoAnexado: null });
  };

 // AGENDAMENTO SALVO NO SUPABASE (MAPEAMENTO EXATO DAS COLUNAS)
  const handleSolicitarAgendamento = async (e) => {
    e.preventDefault();
    if (!solicitacao.gradeIdSelecionada) return alert('Por favor, selecione uma vaga na lista.');
    
    const gradeEscolhida = gradesDisponiveis.find(g => g.id === parseInt(solicitacao.gradeIdSelecionada));

    try {
      const { error } = await supabase.from('agendamentos').insert([
        {
          cidadao_id: loggedUserData.id || 1, // Usa o ID do cidadão logado no Supabase
          posto_id: 1, // ID do posto selecionado
          grade_id: gradeEscolhida.id,
          tipo: solicitacao.tipo,
          especialidade: solicitacao.especialidade,
          data_agendamento: gradeEscolhida.data,
          horario: gradeEscolhida.horario,
          status: 'Pendente',
          confirmacao_cidadao: 'pendente',
          situacao_atendimento: 'pendente'
        }
      ]);
      if (error) throw error;

      await fetchAgendamentosSupabase();
      alert(`Solicitação gravada no Supabase para a unidade: ${solicitacao.posto}!`);
      setCurrentTab('fila');
    } catch (err) {
      alert('Erro ao salvar agendamento no Supabase: ' + err.message);
    }
  };

  const handleExcluirGrade = (id) => {
    if (window.confirm('Deseja remover esta vaga da grade disponibilizada?')) {
      setGradesDisponiveis(gradesDisponiveis.filter(g => g.id !== id));
    }
  };

  const solicitacoesDoPosto = agendamentos.filter(a => a.posto === loggedUserData?.unidade || true);

  const pacientesComAtendimentoHumanoDoPosto = dbCidadaos.filter(cidadao => 
    mensagensChat.some(m => m.cpf === cidadao.cpf && m.postoDestino === loggedUserData?.unidade && m.solicitouHumano)
  );

  const gradesDoPostoFiltradas = gradesDisponiveis.filter(g => {
    if (filtroGradeEspecialidade && g.especialidade !== filtroGradeEspecialidade) return false;
    if (filtroGradeMedico && !g.medico.toLowerCase().includes(filtroGradeMedico.toLowerCase())) return false;
    if (filtroGradeData && g.data !== filtroGradeData) return false;
    return true;
  });

  // =========================================================
  // TELA DE ENTRADA / LOGIN
  // =========================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#12161b] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="text-center mb-6 flex flex-col items-center">
          <MedTechLogo isLarge={true} />
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-3">
            Sistema Unificado de Agendamentos e Exames - Barra Mansa / RJ
          </p>
        </div>

        {!selectedProfile ? (
          <div className="w-full max-w-2xl">
            <h3 className="text-center text-slate-300 text-xs font-semibold mb-6 uppercase tracking-wider">
              Selecione o perfil de acesso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => { setSelectedProfile('citizen'); setAuthMode('login'); }}
                className="bg-slate-800/80 hover:bg-slate-800 border-2 border-blue-600/40 hover:border-blue-500 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center text-center group"
              >
                <div className="bg-blue-600/20 p-4 rounded-2xl mb-4">
                  <User className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Portal do Cidadão</h2>
                <p className="text-xs text-slate-400 mb-6">Acesso para solicitações do SUS, agendamentos e laudos.</p>
                <span className="mt-auto bg-[#0056b3] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow">
                  ENTRAR COMO CIDADÃO
                </span>
              </div>

              <div 
                onClick={() => { setSelectedProfile('admin'); setAuthMode('login'); }}
                className="bg-slate-800/80 hover:bg-slate-800 border-2 border-emerald-600/40 hover:border-emerald-500 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center text-center group"
              >
                <div className="bg-emerald-600/20 p-4 rounded-2xl mb-4">
                  <Building2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Postos de Saúde</h2>
                <p className="text-xs text-slate-400 mb-6">Gestão de vagas, aprovação de fila e envio de laudos.</p>
                <span className="mt-auto bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow">
                  ENTRAR COMO POSTO
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-white text-xs font-semibold mb-4 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {selectedProfile === 'citizen' && (
              <div className="bg-white rounded-2xl p-6 shadow-2xl border-t-8 border-[#0056b3]">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-xl"><User className="w-6 h-6 text-[#0056b3]" /></div>
                  <div className="flex gap-2">
                    <button onClick={() => setAuthMode('login')} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${authMode === 'login' ? 'bg-[#0056b3] text-white' : 'text-slate-600'}`}>Login</button>
                    <button onClick={() => setAuthMode('register')} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${authMode === 'register' ? 'bg-[#0056b3] text-white' : 'text-slate-600'}`}>Cadastrar</button>
                  </div>
                </div>

                {authMode === 'login' ? (
                  <form onSubmit={handleLoginCitizen} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                      <input type="text" placeholder="123.456.789-00" value={formCitizen.cpf} onChange={e => setFormCitizen({...formCitizen, cpf: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Cartão SUS</label>
                      <input type="text" placeholder="700000000000001" value={formCitizen.cartaoSus} onChange={e => setFormCitizen({...formCitizen, cartaoSus: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={formCitizen.senha} onChange={e => setFormCitizen({...formCitizen, senha: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800 pr-10" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#0056b3] text-white font-bold py-3 rounded-lg text-sm">ENTRAR NO SISTEMA</button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterCitizen} className="space-y-3">
                    <input type="text" placeholder="Nome Completo" value={formCitizen.nome} onChange={e => setFormCitizen({...formCitizen, nome: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="CPF" value={formCitizen.cpf} onChange={e => setFormCitizen({...formCitizen, cpf: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="Cartão SUS" value={formCitizen.cartaoSus} onChange={e => setFormCitizen({...formCitizen, cartaoSus: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="WhatsApp (DDD+Número)" value={formCitizen.telefone} onChange={e => setFormCitizen({...formCitizen, telefone: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Senha" value={formCitizen.senha} onChange={e => setFormCitizen({...formCitizen, senha: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600"><input type="checkbox" checked={formCitizen.lgpdAceite} onChange={e => setFormCitizen({...formCitizen, lgpdAceite: e.target.checked})} /> Aceito os termos da LGPD</div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">CADASTRAR E SALVAR</button>
                  </form>
                )}
              </div>
            )}

            {selectedProfile === 'admin' && (
              <div className="bg-[#1a1e24] rounded-2xl p-6 shadow-2xl border-t-8 border-slate-600 text-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-slate-800 p-2.5 rounded-xl"><Building2 className="w-6 h-6 text-emerald-400" /></div>
                  <div className="flex gap-2">
                    <button onClick={() => setAuthMode('login')} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${authMode === 'login' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Login</button>
                    <button onClick={() => setAuthMode('register')} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${authMode === 'register' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Cadastrar</button>
                  </div>
                </div>

                {authMode === 'login' ? (
                  <form onSubmit={handleLoginAdmin} className="space-y-4">
                    <input type="text" placeholder="Matrícula" value={formAdmin.usuario} onChange={e => setFormAdmin({...formAdmin, usuario: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100" required />
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Senha" value={formAdmin.senha} onChange={e => setFormAdmin({...formAdmin, senha: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm">ENTRAR COMO POSTO</button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterAdmin} className="space-y-3">
                    <select value={formAdmin.unidade} onChange={e => setFormAdmin({...formAdmin, unidade: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100">
                      {UNIDADES_SAUDE.map((u, i) => <option key={i} value={u}>{u}</option>)}
                    </select>
                    <input type="text" placeholder="Matrícula/Usuário" value={formAdmin.usuario} onChange={e => setFormAdmin({...formAdmin, usuario: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Senha" value={formAdmin.senha} onChange={e => setFormAdmin({...formAdmin, senha: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400"><input type="checkbox" checked={formAdmin.lgpdAceite} onChange={e => setFormAdmin({...formAdmin, lgpdAceite: e.target.checked})} /> Termo Municipal</div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">CADASTRAR UNIDADE</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // SISTEMA PRINCIPAL LOGADO
  // =========================================================
  return (
    <div className={`min-h-screen font-sans ${currentUser === 'citizen' ? 'bg-slate-50 text-slate-800' : 'bg-[#12161b] text-slate-100'}`}>
      
      {/* HEADER PRINCIPAL */}
      <header className={`border-b ${currentUser === 'citizen' ? 'bg-[#0056b3] border-blue-700 text-white' : 'bg-[#1a1e24] border-slate-700 text-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <MedTechLogo isLarge={false} forceWhiteBg={currentUser === 'citizen'} />
            <span className="text-xs sm:text-sm opacity-90 border-l border-white/20 pl-3 hidden sm:inline">
              {currentUser === 'citizen' ? 'Portal do Cidadão - Barra Mansa' : `Posto Logado: ${loggedUserData?.unidade}`}
            </span>
          </div>

          <button onClick={handleLogout} className="bg-black/20 hover:bg-black/40 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
            Sair
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* ================= PORTAL DO CIDADÃO ================= */}
        {currentUser === 'citizen' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
              <div className="pb-3 mb-2 border-b">
                <p className="text-xs text-slate-500">Paciente</p>
                <p className="text-sm font-bold text-slate-800">{loggedUserData?.nome}</p>
                <p className="text-[11px] text-slate-500">CPF: {loggedUserData?.cpf}</p>
              </div>

              <button onClick={() => setCurrentTab('solicitar')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'solicitar' ? 'bg-blue-50 text-[#0056b3] font-bold border-l-4 border-[#0056b3]' : 'text-slate-600'}`}>
                <Plus className="w-4 h-4" /> Solicitar Agendamento
              </button>
              <button onClick={() => setCurrentTab('fila')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'fila' ? 'bg-blue-50 text-[#0056b3] font-bold border-l-4 border-[#0056b3]' : 'text-slate-600'}`}>
                <Clock className="w-4 h-4" /> Status e Confirmação
              </button>
              <button onClick={() => setCurrentTab('exames')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'exames' ? 'bg-blue-50 text-[#0056b3] font-bold border-l-4 border-[#0056b3]' : 'text-slate-600'}`}>
                <FileText className="w-4 h-4" /> Meus Exames
              </button>
              <button onClick={() => setCurrentTab('chat')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'chat' ? 'bg-blue-50 text-[#0056b3] font-bold border-l-4 border-[#0056b3]' : 'text-slate-600'}`}>
                <MessageSquare className="w-4 h-4" /> Assistente IA / Chat
              </button>
              <button onClick={() => setCurrentTab('perfil')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'perfil' ? 'bg-blue-50 text-[#0056b3] font-bold border-l-4 border-[#0056b3]' : 'text-slate-600'}`}>
                <User className="w-4 h-4" /> Meu Perfil / Notificações
              </button>
            </div>

            <div className="md:col-span-3">
              {currentTab === 'solicitar' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-3">Agendar Consulta ou Exame</h2>
                  
                  <form onSubmit={handleSolicitarAgendamento} className="space-y-4">
                    
                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                      <label className="block text-xs font-bold text-[#0056b3] mb-1 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" /> Selecione o Posto / Unidade de Saúde Desejada:
                      </label>
                      <select 
                        value={solicitacao.posto} 
                        onChange={e => setSolicitacao({...solicitacao, posto: e.target.value, gradeIdSelecionada: ''})} 
                        className="w-full border border-blue-300 rounded-lg p-2.5 text-sm font-semibold bg-white text-slate-800 outline-none"
                      >
                        {UNIDADES_SAUDE.map((unidade, idx) => (
                          <option key={idx} value={unidade}>{unidade}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Tipo de Atendimento</label>
                        <select value={solicitacao.tipo} onChange={e => setSolicitacao({...solicitacao, tipo: e.target.value, gradeIdSelecionada: ''})} className="w-full border rounded-lg p-2.5 text-sm">
                          <option value="Consulta">Consulta Médica</option>
                          <option value="Exame">Exame Laboratorial / Imagem</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Especialidade / Exame</label>
                        <select value={solicitacao.especialidade} onChange={e => setSolicitacao({...solicitacao, especialidade: e.target.value, gradeIdSelecionada: ''})} className="w-full border rounded-lg p-2.5 text-sm">
                          {(solicitacao.tipo === 'Consulta' ? ESPECIALIDADES_CONSULTA : TIPOS_EXAMES).map((item, idx) => (
                            <option key={idx} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Vagas liberadas para o posto [{solicitacao.posto}]:
                      </label>

                      {gradesDisponiveis.filter(g => g.posto === solicitacao.posto && g.categoria === solicitacao.tipo && g.especialidade === solicitacao.especialidade && g.vagas > 0).length === 0 ? (
                        <p className="text-xs text-slate-500 py-3 text-center">Nenhuma vaga disponibilizada por esta unidade para a especialidade selecionada no momento.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {gradesDisponiveis.filter(g => g.posto === solicitacao.posto && g.categoria === solicitacao.tipo && g.especialidade === solicitacao.especialidade && g.vagas > 0).map(g => (
                            <label key={g.id} className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${solicitacao.gradeIdSelecionada === String(g.id) ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500' : 'bg-white'}`}>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="gradeOption" value={g.id} checked={solicitacao.gradeIdSelecionada === String(g.id)} onChange={e => setSolicitacao({...solicitacao, gradeIdSelecionada: e.target.value})} />
                                <div>
                                  <p className="text-xs font-bold">{formatarDataBR(g.data)} às {g.horario}h</p>
                                  <p className="text-[11px] text-slate-500">{g.medico}</p>
                                </div>
                              </div>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{g.vagas} vagas</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={!solicitacao.gradeIdSelecionada} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg text-sm shadow">
                      CONFIRMAR AGENDAMENTO NA VAGA SELECIONADA
                    </button>
                  </form>
                </div>
              )}

              {/* STATUS E CONFIRMAÇÃO DO CIDADÃO */}
              {currentTab === 'fila' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-3">Status e Confirmação de Presença</h2>
                  
                  <div className="space-y-4">
                    {agendamentos.filter(a => a.cpf === loggedUserData?.cpf).map(item => (
                      <div key={item.id} className="p-4 rounded-xl border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Recusado' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">{formatarDataBR(item.data)} às {item.horario}h</span>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-base mt-1">{item.especialidade}</h4>
                          <p className="text-xs text-slate-600 font-medium">Unidade: {item.posto}</p>

                          {item.status === 'Recusado' && (
                            <p className="text-xs text-rose-700 mt-2 bg-rose-50 p-2 rounded border border-rose-200">
                              <strong>Motivo do Indeferimento:</strong> {item.motivoRecusado}
                            </p>
                          )}
                        </div>

                        {item.status === 'Aprovado' && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 shrink-0">
                            <p className="text-[11px] font-bold text-slate-700 text-center">Confirmar presença (1 dia antes)?</p>
                            
                            {item.confirmacaoCidadao === 'confirmado' ? (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded text-center flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Presença Confirmada
                              </span>
                            ) : item.confirmacaoCidadao === 'desistiu' ? (
                              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded text-center">
                                Cancelado pelo Cidadão
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleConfirmarPresencaCidadao(item.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-bold transition">
                                  SIM, VOU
                                </button>
                                <button onClick={() => handleOpenModalDesistencia(item.id)} className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded font-bold transition">
                                  NÃO PODEREI IR
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'exames' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-3">Laudos Disponíveis</h2>
                  {exames.filter(e => e.cpf === loggedUserData?.cpf).map(ex => (
                    <div key={ex.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{ex.exame}</h4>
                        <p className="text-xs text-slate-500">{ex.local} • {formatarDataBR(ex.data)}</p>
                      </div>
                      <button onClick={() => alert(`Baixando ${ex.arquivo}...`)} className="bg-[#0056b3] text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                        <Download className="w-4 h-4" /> Baixar PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CHAT IA MULTI-OPÇÕES DO CIDADÃO */}
              {currentTab === 'chat' && (
                <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[520px]">
                  <div className="p-4 border-b bg-blue-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#0056b3]" /> Orientação IA e Chat da Unidade
                    </h3>
                    <button onClick={handleSolicitarAtendimentoHumano} className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow">
                      Falar com o Posto ({solicitacao.posto})
                    </button>
                  </div>

                  <div className="bg-slate-100 p-2.5 border-b flex flex-wrap gap-2 text-xs">
                    <button onClick={() => handleOpcaoIA(1, 'Como agendar?')} className="bg-white border rounded-lg px-2.5 py-1 text-slate-700 font-medium">📅 Agendamentos</button>
                    <button onClick={() => handleOpcaoIA(2, 'Onde ver laudos?')} className="bg-white border rounded-lg px-2.5 py-1 text-slate-700 font-medium">📄 Laudos/Exames</button>
                    <button onClick={() => handleOpcaoIA(3, 'Horário UBS')} className="bg-white border rounded-lg px-2.5 py-1 text-slate-700 font-medium">🕒 Horários UBS</button>
                    <button onClick={() => handleOpcaoIA(4, 'Documentos')} className="bg-white border rounded-lg px-2.5 py-1 text-slate-700 font-medium">🪪 Documentos</button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm max-h-[360px]">
                    {mensagensChat.filter(m => m.cpf === loggedUserData?.cpf).map(m => (
                      <div key={m.id} className={`flex ${m.remetente === loggedUserData?.nome ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${m.remetente === loggedUserData?.nome ? 'bg-[#0056b3] text-white' : 'bg-slate-100 text-slate-800'}`}>
                          <p className="text-[10px] font-bold opacity-75">{m.remetente} • {m.dataHora}</p>
                          <p className="mt-1">{m.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleOpcaoIA(0, chatInput); setChatInput(''); }} className="p-3 border-t flex gap-2">
                    <input type="text" placeholder="Digite sua dúvida..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" />
                    <button type="submit" className="bg-[#0056b3] text-white px-4 py-2 rounded-lg text-sm font-medium"><Send className="w-4 h-4" /></button>
                  </form>
                </div>
              )}

              {/* PERFIL */}
              {currentTab === 'perfil' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">Meu Perfil e Notificações</h2>
                  
                  <form onSubmit={handleUpdatePerfil} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                      <input type="text" value={loggedUserData?.nome || ''} onChange={e => setLoggedUserData({...loggedUserData, nome: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">CPF (Fixo)</label>
                        <input type="text" value={loggedUserData?.cpf || ''} disabled className="w-full bg-slate-100 border rounded-lg p-2.5 text-sm text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cartão SUS (Fixo)</label>
                        <input type="text" value={loggedUserData?.cartaoSus || ''} disabled className="w-full bg-slate-100 border rounded-lg p-2.5 text-sm text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail Cadastrado</label>
                      <input type="email" value={loggedUserData?.email || ''} onChange={e => setLoggedUserData({...loggedUserData, email: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800" required />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp (DDD + Número)</label>
                      <input type="text" value={loggedUserData?.telefone || ''} onChange={e => setLoggedUserData({...loggedUserData, telefone: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm text-slate-800" required />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                      <label className="block text-xs font-bold text-blue-900">Canal Preferencial para Lembretes:</label>
                      <select value={loggedUserData?.notificacaoPref || 'whatsapp'} onChange={e => setLoggedUserData({...loggedUserData, notificacaoPref: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800">
                        <option value="whatsapp">Enviar no WhatsApp</option>
                        <option value="email">Enviar no E-mail</option>
                        <option value="ambos">Enviar em Ambos</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> SALVAR DADOS DO PERFIL
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PORTAL DO POSTO DE SAÚDE ================= */}
        {currentUser === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="md:col-span-1 bg-[#1a1e24] rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="pb-3 mb-2 border-b border-slate-700">
                <p className="text-xs text-slate-400">Posto Logado</p>
                <p className="text-sm font-bold text-slate-100">{loggedUserData?.unidade}</p>
              </div>

              <button onClick={() => setCurrentTab('fila_admin')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'fila_admin' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4" /> Solicitações da Unidade
              </button>
              <button onClick={() => setCurrentTab('grade')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'grade' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <Calendar className="w-4 h-4" /> Abertura de Grade
              </button>
              <button onClick={() => setCurrentTab('agenda_google')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'agenda_google' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <CalendarDays className="w-4 h-4" /> Agenda Diária da Unidade
              </button>
              <button onClick={() => setCurrentTab('upload')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'upload' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <Upload className="w-4 h-4" /> Upload de Exames (PDF)
              </button>
              <button onClick={() => setCurrentTab('chat_admin')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 relative ${currentTab === 'chat_admin' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <MessageSquare className="w-4 h-4" /> Atendimento Humano
              </button>
            </div>

            <div className="md:col-span-3">
              
              {/* FILA DE SOLICITAÇÕES DA UNIDADE */}
              {currentTab === 'fila_admin' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">
                    Solicitações Recebidas ({loggedUserData?.unidade})
                  </h2>
                  
                  {solicitacoesDoPosto.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhuma solicitação direcionada para esta unidade de saúde.</p>
                  ) : (
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead>
                        <tr className="bg-slate-800/60 border-b border-slate-700 text-xs">
                          <th className="p-3">Paciente</th>
                          <th className="p-3">Especialidade</th>
                          <th className="p-3">Data/Hora</th>
                          <th className="p-3">Confirmação</th>
                          <th className="p-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {solicitacoesDoPosto.map(item => (
                          <tr key={item.id}>
                            <td className="p-3 font-bold">{item.cidadao}</td>
                            <td className="p-3">{item.especialidade}</td>
                            <td className="p-3 text-xs text-emerald-400">{formatarDataBR(item.data)} às {item.horario}h</td>
                            <td className="p-3">
                              {item.confirmacaoCidadao === 'confirmado' ? (
                                <span className="bg-emerald-950 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-800 font-bold">Confirmou Presença</span>
                              ) : item.confirmacaoCidadao === 'desistiu' ? (
                                <span className="bg-rose-950 text-rose-400 text-xs px-2 py-0.5 rounded border border-rose-800 font-bold">Desistiu</span>
                              ) : (
                                <span className="text-slate-500 text-xs">Aguardando</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {item.status === 'Pendente' ? (
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => handleAprovarSolicitacao(item)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold">Aprovar</button>
                                  <button onClick={() => handleOpenModalRecusa(item.id)} className="bg-rose-600 text-white px-2.5 py-1 rounded text-xs font-bold">Recusar</button>
                                </div>
                              ) : item.status === 'Aprovado' ? (
                                <button onClick={() => handleOpenModalRecusa(item.id)} className="bg-amber-600 text-white px-2.5 py-1 rounded text-xs font-bold">Alterar p/ Recusado</button>
                              ) : (
                                <button onClick={() => handleAprovarSolicitacao(item)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold">Re-Aprovar</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ABERTURA DE GRADE */}
              {currentTab === 'grade' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">Disponibilizar Vagas na Grade ({loggedUserData?.unidade})</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setGradesDisponiveis([...gradesDisponiveis, { id: Date.now(), posto: loggedUserData.unidade, ...novaGrade }]);
                      alert('Vagas disponibilizadas para esta unidade de saúde!');
                    }} className="space-y-4 max-w-xl">
                      <select value={novaGrade.categoria} onChange={e => setNovaGrade({...novaGrade, categoria: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                        <option value="Consulta">Consulta Médica</option>
                        <option value="Exame">Exame Laboratorial / Imagem</option>
                      </select>
                      <select value={novaGrade.especialidade} onChange={e => setNovaGrade({...novaGrade, especialidade: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                        {(novaGrade.categoria === 'Consulta' ? ESPECIALIDADES_CONSULTA : TIPOS_EXAMES).map((item, idx) => (
                          <option key={idx} value={item}>{item}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Médico / Profissional Responsável" value={novaGrade.medico} onChange={e => setNovaGrade({...novaGrade, medico: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100" required />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="date" value={novaGrade.data} onChange={e => setNovaGrade({...novaGrade, data: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                        <input type="time" value={novaGrade.horario} onChange={e => setNovaGrade({...novaGrade, horario: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                        <input type="number" placeholder="Qtde Vagas" value={novaGrade.vagas} onChange={e => setNovaGrade({...novaGrade, vagas: parseInt(e.target.value)})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm">PUBLICAR GRADE</button>
                    </form>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-400" /> Grades Publicadas ({gradesDoPostoFiltradas.length})
                      </h3>

                      <div className="flex flex-wrap items-center gap-2">
                        <select value={filtroGradeEspecialidade} onChange={e => setFiltroGradeEspecialidade(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5">
                          <option value="">Todas Especialidades</option>
                          {[...ESPECIALIDADES_CONSULTA, ...TIPOS_EXAMES].map((e, idx) => (
                            <option key={idx} value={e}>{e}</option>
                          ))}
                        </select>

                        <input type="text" placeholder="Filtrar Médico..." value={filtroGradeMedico} onChange={e => setFiltroGradeMedico(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 w-32" />

                        <input type="date" value={filtroGradeData} onChange={e => setFiltroGradeData(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5" />

                        {(filtroGradeEspecialidade || filtroGradeMedico || filtroGradeData) && (
                          <button onClick={() => { setFiltroGradeEspecialidade(''); setFiltroGradeMedico(''); setFiltroGradeData(''); }} className="text-[11px] text-amber-400 hover:underline">
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>

                    {gradesDoPostoFiltradas.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhuma grade cadastrada nesta unidade para os filtros aplicados.</p>
                    ) : (
                      <div className="overflow-x-auto pb-3 snap-x">
                        <div className="flex flex-col flex-wrap gap-3 max-h-[340px] w-max">
                          {gradesDoPostoFiltradas.map(g => (
                            <div key={g.id} className="bg-slate-900/90 border border-slate-700 hover:border-emerald-500/50 p-3.5 rounded-xl w-72 sm:w-80 shadow flex justify-between items-center snap-start transition">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-emerald-400 truncate max-w-[200px]">{g.especialidade} ({g.categoria})</p>
                                <p className="text-xs text-slate-100 font-semibold">{formatarDataBR(g.data)} às {g.horario}h</p>
                                <p className="text-[11px] text-slate-400">{g.medico || 'Profissional não inf.'}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full">
                                  {g.vagas} vagas
                                </span>
                                <button onClick={() => handleExcluirGrade(g.id)} title="Excluir vaga" className="text-rose-400 hover:text-rose-300 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AGENDA DIÁRIA EXCLUSIVA DA UNIDADE */}
              {currentTab === 'agenda_google' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-700 pb-3">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-emerald-400" /> Agenda da Unidade ({loggedUserData?.unidade})
                    </h2>
                    
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                      <Search className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400 font-bold">Filtrar Dia:</span>
                      <input type="date" value={filtroDataAgenda} onChange={e => setFiltroDataAgenda(e.target.value)} className="bg-slate-800 text-white text-xs p-1 rounded border border-slate-600 outline-none" />
                      <button onClick={() => setFiltroDataAgenda('')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2 py-1 rounded font-bold transition">
                        Ver Todos os Dias
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {solicitacoesDoPosto.filter(a => a.status === 'Aprovado' && (!filtroDataAgenda || a.data === filtroDataAgenda)).length === 0 ? (
                      <p className="text-xs text-slate-400 col-span-2 text-center py-6">Nenhum atendimento aprovado para este filtro na sua unidade.</p>
                    ) : (
                      solicitacoesDoPosto.filter(a => a.status === 'Aprovado' && (!filtroDataAgenda || a.data === filtroDataAgenda)).map(item => {
                        const isConcluido = item.situacaoAtendimento === 'concluido';
                        const isNaoConcluido = item.situacaoAtendimento === 'nao_concluido';

                        const dataHojeStr = new Date().toISOString().split('T')[0];
                        const ehDataFutura = item.data > dataHojeStr;
                        const pacienteConfirmou = item.confirmacaoCidadao === 'confirmado';
                        const podeAprovarConcluido = !ehDataFutura && pacienteConfirmou;

                        return (
                          <div key={item.id} className={`p-4 rounded-xl border-l-4 shadow flex flex-col justify-between ${isConcluido ? 'bg-blue-950/40 border-blue-500' : isNaoConcluido ? 'bg-rose-950/40 border-rose-500' : 'bg-emerald-950/40 border-emerald-500'}`}>
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-slate-300 font-bold">{formatarDataBR(item.data)} às {item.horario}h</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isConcluido ? 'bg-blue-600 text-white' : isNaoConcluido ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                  {isConcluido ? 'Concluído' : isNaoConcluido ? 'Não Concluído' : 'Pendente'}
                                </span>
                              </div>

                              <h4 className="font-bold text-slate-100 text-base">{item.cidadao}</h4>
                              <p className="text-xs text-slate-300 mb-2">{item.especialidade}</p>

                              {!isConcluido && !podeAprovarConcluido && (
                                <div className="mt-2 bg-amber-950/60 border border-amber-800 p-2 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-300">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                  <span>
                                    {ehDataFutura 
                                      ? 'Bloqueado: Aguardando a data do atendimento.' 
                                      : 'Bloqueado: Aguardando confirmação do cidadão.'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-800/60">
                              <button 
                                disabled={!podeAprovarConcluido}
                                onClick={() => setAgendamentos(agendamentos.map(a => a.id === item.id ? { ...a, situacaoAtendimento: 'concluido' } : a))} 
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded font-bold flex-1 transition"
                              >
                                Concluído
                              </button>
                              
                              <button 
                                onClick={() => { setAgendamentoNaoConcluidoId(item.id); setModalMotivoOpen(true); }} 
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded font-bold flex-1 transition"
                              >
                                Não Concluído
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* UPLOAD DE EXAMES */}
              {currentTab === 'upload' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">Upload de Laudo (Unidade: {loggedUserData?.unidade})</h2>
                  
                  <form onSubmit={handleUploadLaudo} className="space-y-4 max-w-xl">
                    <input type="text" placeholder="CPF do Paciente" value={novoLaudo.cpf} onChange={e => setNovoLaudo({...novoLaudo, cpf: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100" required />
                    <select value={novoLaudo.tipoExame} onChange={e => setNovoLaudo({...novoLaudo, tipoExame: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                      {TIPOS_EXAMES.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
                    </select>

                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center bg-slate-900/50">
                      <input type="file" accept=".pdf" id="fileLaudo" onChange={e => setNovoLaudo({...novoLaudo, arquivoAnexado: e.target.files[0]})} className="hidden" />
                      <label htmlFor="fileLaudo" className="cursor-pointer flex flex-col items-center">
                        <Paperclip className="w-8 h-8 text-emerald-400 mb-2" />
                        <span className="text-xs text-slate-300 font-bold">
                          {novoLaudo.arquivoAnexado ? `PDF Anexado: ${novoLaudo.arquivoAnexado.name}` : 'Clique para Anexar o PDF do Exame'}
                        </span>
                      </label>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">ENVIAR EXAME</button>
                  </form>
                </div>
              )}

              {/* CHAT DO POSTO */}
              {currentTab === 'chat_admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[520px]">
                  
                  <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-2 max-h-[500px]">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Atendimento Humano ({loggedUserData?.unidade})</h4>
                    
                    {pacientesComAtendimentoHumanoDoPosto.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhum paciente solicitou atendimento humano para esta unidade.</p>
                    ) : (
                      pacientesComAtendimentoHumanoDoPosto.map(cidadao => {
                        const temNaoLida = mensagensChat.some(m => m.cpf === cidadao.cpf && m.postoDestino === loggedUserData?.unidade && !m.lidaPeloPosto);
                        const isSelected = usuarioChatSelecionadoPosto === cidadao.cpf;

                        return (
                          <div 
                            key={cidadao.cpf}
                            onClick={() => {
                              setUsuarioChatSelecionadoPosto(cidadao.cpf);
                              setMensagensChat(mensagensChat.map(m => (m.cpf === cidadao.cpf && m.postoDestino === loggedUserData?.unidade) ? { ...m, lidaPeloPosto: true } : m));
                            }}
                            className={`p-3 rounded-lg cursor-pointer border transition flex items-center justify-between ${isSelected ? 'bg-slate-800 border-emerald-500' : 'bg-slate-950/60 border-slate-800'}`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-100">{cidadao.nome}</p>
                              <p className="text-[10px] text-slate-400">{cidadao.cpf}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {temNaoLida && <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" title="Mensagem Pendente" />}
                              <button 
                                title="Voltar para Não Lida" 
                                onClick={(e) => { e.stopPropagation(); handleToggleLidaPosto(cidadao.cpf, temNaoLida); }} 
                                className="text-slate-500 hover:text-emerald-400 p-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-[#1a1e24] border border-slate-800 rounded-xl flex flex-col max-h-[500px]">
                    <div className="p-3 border-b border-slate-800 bg-slate-900 rounded-t-xl flex justify-between items-center">
                      <p className="text-xs font-bold text-emerald-400">Atendendo: {dbCidadaos.find(c => c.cpf === usuarioChatSelecionadoPosto)?.nome || 'Selecione um paciente'}</p>
                      <button onClick={() => handleToggleLidaPosto(usuarioChatSelecionadoPosto, true)} className="text-[11px] text-amber-400 hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Marcar como não lida
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm max-h-[380px]">
                      {mensagensChat.filter(m => m.cpf === usuarioChatSelecionadoPosto && m.postoDestino === loggedUserData?.unidade).map(m => (
                        <div key={m.id} className={`flex ${m.remetente.includes('Equipe') ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-xl ${m.remetente.includes('Equipe') ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                            <p className="text-[10px] font-bold opacity-75">{m.remetente} • {m.dataHora}</p>
                            <p className="mt-1">{m.texto}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendChatPosto} className="p-3 border-t border-slate-800 flex gap-2">
                      <input type="text" placeholder="Digite sua resposta..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none" />
                      <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm"><Send className="w-4 h-4" /></button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL SIMULADOR WHATSAPP */}
      {modalWppAutoOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 text-slate-100 shadow-2xl">
            <h3 className="font-bold text-emerald-400 text-base mb-2 flex items-center gap-2">
              <Phone className="w-5 h-5" /> Notificação Enviada
            </h3>
            <p className="text-xs text-slate-400 mb-3">Mensagem formatada e enviada para o paciente:</p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-mono mb-4">
              {mensagemWppAuto}
            </div>
            <button onClick={() => setModalWppAutoOpen(false)} className="w-full bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL RECUSA COM MOTIVO */}
      {modalRecusaOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 text-slate-100">
            <h3 className="font-bold text-rose-400 text-base mb-2">Motivo do Indeferimento</h3>
            <form onSubmit={handleConfirmarRecusa} className="space-y-4">
              <textarea rows="3" placeholder="Ex: Equipamento em manutenção..." value={textoMotivoRecusa} onChange={e => setTextoMotivoRecusa(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 outline-none" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalRecusaOpen(false)} className="bg-slate-800 text-slate-300 py-2 px-4 rounded-lg text-xs font-bold flex-1">Cancelar</button>
                <button type="submit" className="bg-rose-600 text-white py-2 px-4 rounded-lg text-xs font-bold flex-1">Confirmar Recusa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CANCELAMENTO PELO CIDADÃO */}
      {modalDesistenciaOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-5 text-slate-800">
            <h3 className="font-bold text-slate-800 text-base mb-2">Motivo do Cancelamento</h3>
            <p className="text-xs text-slate-500 mb-3">Sua vaga será reaberta para a grade.</p>
            <form onSubmit={handleSalvarDesistencia} className="space-y-4">
              <textarea rows="3" placeholder="Ex: Imprevisto de trabalho..." value={textoDesistencia} onChange={e => setTextoDesistencia(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalDesistenciaOpen(false)} className="bg-slate-200 text-slate-700 py-2 px-4 rounded-lg text-xs font-bold flex-1">Cancelar</button>
                <button type="submit" className="bg-rose-600 text-white py-2 px-4 rounded-lg text-xs font-bold flex-1">Enviar Cancelamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NÃO CONCLUÍDO */}
      {modalMotivoOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 text-slate-100">
            <h3 className="font-bold text-rose-400 text-base mb-2">Motivo do Não Comparecimento</h3>
            <form onSubmit={(e) => { e.preventDefault(); setAgendamentos(agendamentos.map(a => a.id === agendamentoNaoConcluidoId ? { ...a, situacaoAtendimento: 'nao_concluido', motivoNaoConcluido: textoMotivoNaoConcluido } : a)); setModalMotivoOpen(false); }} className="space-y-4">
              <textarea rows="3" placeholder="Ex: Paciente faltou..." value={textoMotivoNaoConcluido} onChange={e => setTextoMotivoNaoConcluido(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 outline-none" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalMotivoOpen(false)} className="bg-slate-800 text-slate-300 py-2 px-4 rounded-lg text-xs font-bold flex-1">Cancelar</button>
                <button type="submit" className="bg-rose-600 text-white py-2 px-4 rounded-lg text-xs font-bold flex-1">Salvar Motivo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}