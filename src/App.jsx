import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, FileText, MessageSquare, Send, CheckCircle, 
  Upload, Plus, Download, User, Building2, Phone, 
  Check, ArrowLeft, Eye, EyeOff, Save,
  CalendarDays, Paperclip, Search, RotateCcw, Trash2, Filter, AlertCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// CONEXÃO COM SUPABASE
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // null, 'citizen', 'admin'
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [currentTab, setCurrentTab] = useState('solicitar');

  const [showPassword, setShowPassword] = useState(false);

  // ESTADOS SINCRONIZADOS COM SUPABASE
  const [dbCidadaos, setDbCidadaos] = useState([]);
  const [dbPostos, setDbPostos] = useState([]);
  const [gradesDisponiveis, setGradesDisponiveis] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [exames, setExames] = useState([]);
  const [mensagensChat, setMensagensChat] = useState([]);

  const [usuarioChatSelecionadoPosto, setUsuarioChatSelecionadoPosto] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const [filtroDataAgenda, setFiltroDataAgenda] = useState('');
  const [modalWppAutoOpen, setModalWppAutoOpen] = useState(false);
  const [mensagemWppAuto, setMensagemWppAuto] = useState('');

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

  const [formCitizen, setFormCitizen] = useState({ nome: '', cpf: '', cartaoSus: '', email: '', telefone: '', notificacaoPref: 'whatsapp', senha: '', lgpdAceite: false });
  const [formAdmin, setFormAdmin] = useState({ unidade: '', usuario: '', senha: '', lgpdAceite: false });
  const [loggedUserData, setLoggedUserData] = useState(null);

  const [solicitacao, setSolicitacao] = useState({ postoId: '', tipo: 'Consulta', especialidade: ESPECIALIDADES_CONSULTA[0], gradeIdSelecionada: '' });
  const [novoLaudo, setNovoLaudo] = useState({ cpf: '', tipoExame: TIPOS_EXAMES[0], arquivoAnexado: null });
  const [novaGrade, setNovaGrade] = useState({ categoria: 'Consulta', especialidade: ESPECIALIDADES_CONSULTA[0], medico: '', data: '', horario: '08:00', vagas: 10 });

  // CARREGAR DADOS GERAIS DO BANCO
  useEffect(() => {
    fetchPostosSupabase();
    fetchCidadaosSupabase();
    fetchGradesSupabase();
    fetchExamesSupabase();
  }, []);

  // CARREGAR DADOS CONTEXTUAIS CONFORME LOGIN
  useEffect(() => {
    if (loggedUserData) {
      fetchAgendamentosSupabase();
      fetchMensagensSupabase();
    }
  }, [loggedUserData, currentUser]);

  async function fetchPostosSupabase() {
    try {
      const { data } = await supabase.from('postos_saude').select('*');
      if (data && data.length > 0) {
        setDbPostos(data);
        if (!solicitacao.postoId) setSolicitacao(prev => ({ ...prev, postoId: data[0].id }));
        if (!formAdmin.unidade) setFormAdmin(prev => ({ ...prev, unidade: data[0].id }));
      }
    } catch (err) {
      console.error("Erro ao buscar postos:", err);
    }
  }

  async function fetchCidadaosSupabase() {
    try {
      const { data } = await supabase.from('cidadaos').select('*');
      if (data) setDbCidadaos(data);
    } catch (err) {
      console.error("Erro ao carregar cidadãos:", err);
    }
  }

  async function fetchGradesSupabase() {
    try {
      const { data } = await supabase.from('grades_vagas').select('*');
      if (data) setGradesDisponiveis(data);
    } catch (err) {
      console.error("Erro ao carregar grades:", err);
    }
  }

  async function fetchExamesSupabase() {
    try {
      const { data } = await supabase.from('exames').select('*');
      if (data) setExames(data);
    } catch (err) {
      console.error("Erro ao carregar exames:", err);
    }
  }

  // RESTRICAO DE DADOS NA BUSCA DO AGENDAMENTO (ISOLAMENTO POR POSTO)
  async function fetchAgendamentosSupabase() {
    try {
      let query = supabase.from('agendamentos').select('*, cidadaos(nome, cpf, cartao_sus, telefone), postos_saude(nome)');

      if (currentUser === 'citizen' && loggedUserData?.id) {
        query = query.eq('cidadao_id', loggedUserData.id);
      } else if (currentUser === 'admin' && loggedUserData?.id) {
        // FILTRA APENAS SOLICITAÇÕES DO POSTO LOGADO
        query = query.eq('posto_id', loggedUserData.id);
      }

      const { data } = await query;
      if (data) setAgendamentos(data);
    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err);
    }
  }

  // RESTRICAO DE DADOS NO CHAT (ISOLAMENTO POR POSTO)
  async function fetchMensagensSupabase() {
    try {
      let query = supabase.from('mensagens_chat').select('*');

      if (currentUser === 'citizen' && loggedUserData?.id) {
        query = query.eq('cidadao_id', loggedUserData.id);
      } else if (currentUser === 'admin' && loggedUserData?.id) {
        // FILTRA MENSAGENS APENAS DA UNIDADE LOGADA
        query = query.eq('posto_id', loggedUserData.id);
      }

      const { data } = await query;
      if (data) setMensagensChat(data);
    } catch (err) {
      console.error("Erro ao buscar mensagens do chat:", err);
    }
  }

  const dispararNotificacaoStatus = (item, status, motivoRecusa = '') => {
    const dataBr = formatarDataBR(item.data_agendamento || item.data);
    const nomePaciente = item.cidadaos?.nome || item.nome_paciente || 'Cidadão';
    const nomePosto = item.postos_saude?.nome || 'Unidade de Saúde';
    let msg = '';
    
    if (status === 'Aprovado') {
      msg = `[MEDTECH BM - MUNICIPAL]\nOlá ${nomePaciente}!\n\nSua solicitação de ${item.especialidade} foi APROVADA!\n\nLocal: ${nomePosto}\nData/Hora: ${dataBr} às ${item.horario}h\n\nAcesse o portal MedTech BM para confirmar sua presença!`;
    } else {
      msg = `[MEDTECH BM - MUNICIPAL]\nOlá ${nomePaciente}.\nInfelizmente sua solicitação para o dia ${dataBr} foi RECUSADA pelo posto ${nomePosto}.\n\nMotivo: ${motivoRecusa}`;
    }

    setMensagemWppAuto(msg);
    setModalWppAutoOpen(true);

    const tel = item.cidadaos?.telefone || item.telefone;
    if (tel) {
      window.open(`https://wa.me/55${tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleLoginCitizen = (e) => {
    e.preventDefault();
    const user = dbCidadaos.find(u => u.cpf.trim() === formCitizen.cpf.trim());
    if (!user) return alert('CPF não encontrado!');
    
    setLoggedUserData(user);
    setCurrentUser('citizen');
    setCurrentTab('solicitar');
  };

  const handleRegisterCitizen = async (e) => {
    e.preventDefault();
    if (!formCitizen.lgpdAceite) return alert('Aceite os termos para continuar.');
    
    try {
      const { data, error } = await supabase.from('cidadaos').insert([
        { 
          nome: formCitizen.nome, 
          cpf: formCitizen.cpf, 
          cartao_sus: formCitizen.cartaoSus, 
          telefone: formCitizen.telefone, 
          email: formCitizen.email || `${formCitizen.cpf}@medtech.bm`
        }
      ]).select().single();

      if (error) throw error;
      
      await fetchCidadaosSupabase();
      alert('Cadastro realizado com sucesso! Faça login.');
      setAuthMode('login');
    } catch (err) {
      alert('Erro ao cadastrar cidadão: ' + err.message);
    }
  };

  const handleLoginAdmin = (e) => {
    e.preventDefault();
    const posto = dbPostos.find(p => p.id === parseInt(formAdmin.unidade) || p.nome === formAdmin.unidade);
    if (!posto) return alert('Posto de saúde não encontrado!');

    setLoggedUserData(posto);
    setCurrentUser('admin');
    setCurrentTab('fila_admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfile(null);
    setLoggedUserData(null);
    setAuthMode('login');
  };

  const handleAprovarSolicitacao = async (item) => {
    try {
      await supabase.from('agendamentos').update({ status: 'Aprovado' }).eq('id', item.id);
      fetchAgendamentosSupabase();
      dispararNotificacaoStatus(item, 'Aprovado');
    } catch (err) {
      alert(err.message);
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
      await supabase.from('agendamentos').update({ status: 'Recusado', motivo_recusado: textoMotivoRecusa }).eq('id', agendamentoRecusaId);
      setModalRecusaOpen(false);
      fetchAgendamentosSupabase();
      dispararNotificacaoStatus(itemRecusado, 'Recusado', textoMotivoRecusa);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmarPresencaCidadao = async (id) => {
    await supabase.from('agendamentos').update({ confirmacao_cidadao: 'confirmado' }).eq('id', id);
    fetchAgendamentosSupabase();
    alert('Sua presença foi CONFIRMADA!');
  };

  const handleOpenModalDesistencia = (id) => {
    setAgendamentoDesistenciaId(id);
    setTextoDesistencia('');
    setModalDesistenciaOpen(true);
  };

  const handleSalvarDesistencia = async (e) => {
    e.preventDefault();
    await supabase.from('agendamentos').update({ confirmacao_cidadao: 'desistiu', justificativa_desistencia: textoDesistencia, status: 'Cancelado pelo Cidadão' }).eq('id', agendamentoDesistenciaId);
    setModalDesistenciaOpen(false);
    fetchAgendamentosSupabase();
    alert('Desistência registrada!');
  };

  // ENVIO E INTERAÇÃO NO CHAT PERSISTIDO NO BANCO
  const handleOpcaoIA = async (opcaoCodigo, textoPergunta) => {
    const postoIdDestino = solicitacao.postoId || (dbPostos[0]?.id);
    
    // Inserção da mensagem do cidadão no Supabase
    await supabase.from('mensagens_chat').insert([
      {
        cidadao_id: loggedUserData.id,
        posto_id: postoIdDestino,
        remetente: loggedUserData.nome,
        texto: textoPergunta,
        lida_pelo_posto: false,
        solicitou_humano: false
      }
    ]);

    let respostaIa = '';
    switch(opcaoCodigo) {
      case 1: respostaIa = '🤖 **IA MedTech - Agendamentos**: Escolha o Posto de Saúde desejado no menu, selecione a especialidade e escolha um dos horários liberados.'; break;
      case 2: respostaIa = '🤖 **IA MedTech - Laudos**: Na aba "Meus Exames", você encontra os laudos liberados para baixar em PDF.'; break;
      case 3: respostaIa = '🤖 **IA MedTech - Horários UBS**: As UBSs atendem de segunda a sexta, das 07h às 17h. As UPAs funcionam 24h.'; break;
      case 4: respostaIa = '🤖 **IA MedTech - Documentos**: Apresente RG, CPF, Comprovante de Residência e Cartão SUS.'; break;
      default: respostaIa = '🤖 **IA MedTech**: Dúvida recebida. Para atendimento humano direto com a equipe da unidade escolhida, clique em "Falar com o Posto".';
    }

    // Resposta automática da IA gravada
    await supabase.from('mensagens_chat').insert([
      {
        cidadao_id: loggedUserData.id,
        posto_id: postoIdDestino,
        remetente: 'Assistente IA MedTech',
        texto: respostaIa,
        lida_pelo_posto: true,
        solicitou_humano: false
      }
    ]);

    fetchMensagensSupabase();
  };

  const handleSolicitarAtendimentoHumano = async () => {
    const postoIdDestino = solicitacao.postoId || (dbPostos[0]?.id);
    await supabase.from('mensagens_chat').insert([
      {
        cidadao_id: loggedUserData.id,
        posto_id: postoIdDestino,
        remetente: loggedUserData.nome,
        texto: `⚠️ SOLICITAÇÃO: Atendimento humano solicitado para esta unidade.`,
        lida_pelo_posto: false,
        solicitou_humano: true
      }
    ]);
    fetchMensagensSupabase();
    alert('Sua conversa foi encaminhada para a fila do posto!');
  };

  const handleSendChatPosto = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !usuarioChatSelecionadoPosto) return;

    await supabase.from('mensagens_chat').insert([
      {
        cidadao_id: usuarioChatSelecionadoPosto,
        posto_id: loggedUserData.id,
        remetente: `Equipe - ${loggedUserData.nome}`,
        texto: chatInput,
        lida_pelo_posto: true,
        solicitou_humano: true
      }
    ]);

    setChatInput('');
    fetchMensagensSupabase();
  };

  // UPLOAD DE EXAMES SALVO NO SUPABASE
  const handleUploadLaudo = async (e) => {
    e.preventDefault();
    const pacienteEncontrado = dbCidadaos.find(c => c.cpf.trim() === novoLaudo.cpf.trim());
    if (!pacienteEncontrado) return alert('CPF do paciente não encontrado cadastrado!');
    if (!novoLaudo.arquivoAnexado) return alert('Anexe o arquivo PDF!');

    try {
      const { error } = await supabase.from('exames').insert([
        {
          cidadao_id: pacienteEncontrado.id,
          posto_id: loggedUserData.id,
          tipo_exame: novoLaudo.tipoExame,
          exame: novoLaudo.tipoExame,
          local: loggedUserData.nome,
          status: 'Pronto',
          arquivo: novoLaudo.arquivoAnexado.name,
          data_exame: new Date().toISOString().split('T')[0]
        }
      ]);
      if (error) throw error;
      alert('Laudo publicado no Supabase com sucesso!');
      setNovoLaudo({ cpf: '', tipoExame: TIPOS_EXAMES[0], arquivoAnexado: null });
      fetchExamesSupabase();
    } catch (err) {
      alert('Erro ao publicar exame: ' + err.message);
    }
  };

  // CRIAR GRADE / VAGA NO BANCO DE DADOS
  const handlePublicarGrade = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('grades_vagas').insert([
        {
          posto_id: loggedUserData.id,
          posto_nome: loggedUserData.nome,
          categoria: novaGrade.categoria,
          especialidade: novaGrade.especialidade,
          medico: novaGrade.medico,
          data: novaGrade.data,
          horario: novaGrade.horario,
          vagas: parseInt(novaGrade.vagas)
        }
      ]);
      if (error) throw error;
      alert('Nova vaga disponibilizada com sucesso no Supabase!');
      fetchGradesSupabase();
    } catch (err) {
      alert('Erro ao publicar grade: ' + err.message);
    }
  };

  const handleExcluirGrade = async (id) => {
    if (window.confirm('Deseja excluir esta vaga da grade?')) {
      await supabase.from('grades_vagas').delete().eq('id', id);
      fetchGradesSupabase();
    }
  };

  // CRIAÇÃO DE AGENDAMENTO COM PERSISTÊNCIA NO BANCO
  const handleSolicitarAgendamento = async (e) => {
    e.preventDefault();
    if (!solicitacao.gradeIdSelecionada) return alert('Selecione uma vaga liberada.');

    const gradeEscolhida = gradesDisponiveis.find(g => g.id === parseInt(solicitacao.gradeIdSelecionada));
    if (!gradeEscolhida) return alert('Vaga não encontrada.');

    try {
      const { error } = await supabase.from('agendamentos').insert([
        {
          cidadao_id: loggedUserData.id,
          posto_id: gradeEscolhida.posto_id || solicitacao.postoId,
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

      fetchAgendamentosSupabase();
      alert('Solicitação gravada com sucesso!');
      setCurrentTab('fila');
    } catch (err) {
      alert('Erro ao salvar agendamento: ' + err.message);
    }
  };

  const gradesDoPostoFiltradas = gradesDisponiveis.filter(g => {
    if (currentUser === 'admin' && g.posto_id !== loggedUserData?.id) return false;
    if (filtroGradeEspecialidade && g.especialidade !== filtroGradeEspecialidade) return false;
    if (filtroGradeMedico && !g.medico?.toLowerCase().includes(filtroGradeMedico.toLowerCase())) return false;
    if (filtroGradeData && g.data !== filtroGradeData) return false;
    return true;
  });

  // TELA DE SELEÇÃO DE PERFIL / LOGIN
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
                    <button type="submit" className="w-full bg-[#0056b3] text-white font-bold py-3 rounded-lg text-sm">ENTRAR NO SISTEMA</button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterCitizen} className="space-y-3">
                    <input type="text" placeholder="Nome Completo" value={formCitizen.nome} onChange={e => setFormCitizen({...formCitizen, nome: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="CPF" value={formCitizen.cpf} onChange={e => setFormCitizen({...formCitizen, cpf: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="Cartão SUS" value={formCitizen.cartaoSus} onChange={e => setFormCitizen({...formCitizen, cartaoSus: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
                    <input type="text" placeholder="WhatsApp" value={formCitizen.telefone} onChange={e => setFormCitizen({...formCitizen, telefone: e.target.value})} className="w-full border rounded-lg p-2 text-sm text-slate-800" required />
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
                </div>

                <form onSubmit={handleLoginAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Selecione a Unidade de Saúde:</label>
                    <select value={formAdmin.unidade} onChange={e => setFormAdmin({...formAdmin, unidade: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                      {dbPostos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-sm">ENTRAR NO PAINEL DA UNIDADE</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // PAINEL LOGADO
  return (
    <div className={`min-h-screen font-sans ${currentUser === 'citizen' ? 'bg-slate-50 text-slate-800' : 'bg-[#12161b] text-slate-100'}`}>
      <header className={`border-b ${currentUser === 'citizen' ? 'bg-[#0056b3] border-blue-700 text-white' : 'bg-[#1a1e24] border-slate-700 text-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <MedTechLogo isLarge={false} forceWhiteBg={currentUser === 'citizen'} />
            <span className="text-xs sm:text-sm opacity-90 border-l border-white/20 pl-3 hidden sm:inline">
              {currentUser === 'citizen' ? 'Portal do Cidadão - Barra Mansa' : `Posto Logado: ${loggedUserData?.nome}`}
            </span>
          </div>
          <button onClick={handleLogout} className="bg-black/20 hover:bg-black/40 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                        value={solicitacao.postoId} 
                        onChange={e => setSolicitacao({...solicitacao, postoId: parseInt(e.target.value), gradeIdSelecionada: ''})} 
                        className="w-full border border-blue-300 rounded-lg p-2.5 text-sm font-semibold bg-white text-slate-800 outline-none"
                      >
                        {dbPostos.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
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
                        Vagas liberadas no Supabase para esta unidade:
                      </label>

                      {gradesDisponiveis.filter(g => g.posto_id === solicitacao.postoId && g.categoria === solicitacao.tipo && g.especialidade === solicitacao.especialidade && g.vagas > 0).length === 0 ? (
                        <p className="text-xs text-slate-500 py-3 text-center">Nenhuma vaga cadastrada para a especialidade selecionada nesta unidade.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {gradesDisponiveis.filter(g => g.posto_id === solicitacao.postoId && g.categoria === solicitacao.tipo && g.especialidade === solicitacao.especialidade && g.vagas > 0).map(g => (
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

              {currentTab === 'fila' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-3">Status dos Meus Agendamentos (Supabase)</h2>
                  <div className="space-y-4">
                    {agendamentos.map(item => (
                      <div key={item.id} className="p-4 rounded-xl border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Recusado' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">{formatarDataBR(item.data_agendamento)} às {item.horario}h</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-base mt-1">{item.especialidade}</h4>
                          <p className="text-xs text-slate-600 font-medium">Unidade: {item.postos_saude?.nome || 'Posto'}</p>
                        </div>

                        {item.status === 'Aprovado' && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 shrink-0">
                            {item.confirmacao_cidadao === 'confirmado' ? (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded text-center flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Presença Confirmada</span>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleConfirmarPresencaCidadao(item.id)} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded font-bold">SIM, VOU</button>
                                <button onClick={() => handleOpenModalDesistencia(item.id)} className="bg-rose-600 text-white text-xs px-3 py-1.5 rounded font-bold">CANCELAR</button>
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
                  <h2 className="text-xl font-bold mb-4 border-b pb-3">Laudos Disponíveis no Supabase</h2>
                  {exames.filter(e => e.cidadao_id === loggedUserData?.id).map(ex => (
                    <div key={ex.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{ex.exame || ex.tipo_exame}</h4>
                        <p className="text-xs text-slate-500">{ex.local} • {formatarDataBR(ex.data_exame)}</p>
                      </div>
                      <button onClick={() => alert(`Baixando laudo: ${ex.arquivo}`)} className="bg-[#0056b3] text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download className="w-4 h-4" /> Baixar PDF</button>
                    </div>
                  ))}
                </div>
              )}

              {currentTab === 'chat' && (
                <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[520px]">
                  <div className="p-4 border-b bg-blue-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0056b3]" /> Orientação IA e Chat com Posto</h3>
                    <button onClick={handleSolicitarAtendimentoHumano} className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold">Falar com Atendente</button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
                    {mensagensChat.map(m => (
                      <div key={m.id} className={`flex ${m.remetente === loggedUserData?.nome ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${m.remetente === loggedUserData?.nome ? 'bg-[#0056b3] text-white' : 'bg-slate-100 text-slate-800'}`}>
                          <p className="text-[10px] font-bold opacity-75">{m.remetente}</p>
                          <p className="mt-1">{m.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleOpcaoIA(0, chatInput); setChatInput(''); }} className="p-3 border-t flex gap-2">
                    <input type="text" placeholder="Digite..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" />
                    <button type="submit" className="bg-[#0056b3] text-white px-4 py-2 rounded-lg text-sm font-medium"><Send className="w-4 h-4" /></button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {currentUser === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-[#1a1e24] rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="pb-3 mb-2 border-b border-slate-700">
                <p className="text-xs text-slate-400">Posto Logado</p>
                <p className="text-sm font-bold text-[#10b981]">{loggedUserData?.nome}</p>
              </div>

              <button onClick={() => setCurrentTab('fila_admin')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'fila_admin' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4" /> Solicitações da Unidade
              </button>
              <button onClick={() => setCurrentTab('grade')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'grade' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <Calendar className="w-4 h-4" /> Abertura de Grade
              </button>
              <button onClick={() => setCurrentTab('upload')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'upload' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <Upload className="w-4 h-4" /> Upload de Exames (PDF)
              </button>
              <button onClick={() => setCurrentTab('chat_admin')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${currentTab === 'chat_admin' ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500' : 'text-slate-400'}`}>
                <MessageSquare className="w-4 h-4" /> Atendimento Humano
              </button>
            </div>

            <div className="md:col-span-3">
              {currentTab === 'fila_admin' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">Solicitações Recebidas ({loggedUserData?.nome})</h2>
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead>
                      <tr className="bg-slate-800/60 border-b border-slate-700 text-xs">
                        <th className="p-3">Paciente</th>
                        <th className="p-3">Especialidade</th>
                        <th className="p-3">Data</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {agendamentos.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold">{item.cidadaos?.nome || 'Paciente'}</td>
                          <td className="p-3">{item.especialidade}</td>
                          <td className="p-3 text-xs text-emerald-400">{formatarDataBR(item.data_agendamento)}</td>
                          <td className="p-3 text-center">
                            {item.status === 'Pendente' ? (
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleAprovarSolicitacao(item)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold">Aprovar</button>
                                <button onClick={() => handleOpenModalRecusa(item.id)} className="bg-rose-600 text-white px-2.5 py-1 rounded text-xs font-bold">Recusar</button>
                              </div>
                            ) : (
                              <span className={`font-bold text-xs ${item.status === 'Aprovado' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentTab === 'grade' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6 space-y-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">Publicar Vaga para {loggedUserData?.nome}</h2>
                  <form onSubmit={handlePublicarGrade} className="space-y-4 max-w-xl">
                    <select value={novaGrade.categoria} onChange={e => setNovaGrade({...novaGrade, categoria: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                      <option value="Consulta">Consulta Médica</option>
                      <option value="Exame">Exame Laboratorial / Imagem</option>
                    </select>
                    <select value={novaGrade.especialidade} onChange={e => setNovaGrade({...novaGrade, especialidade: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                      {(novaGrade.categoria === 'Consulta' ? ESPECIALIDADES_CONSULTA : TIPOS_EXAMES).map((item, idx) => <option key={idx} value={item}>{item}</option>)}
                    </select>
                    <input type="text" placeholder="Médico" value={novaGrade.medico} onChange={e => setNovaGrade({...novaGrade, medico: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100" required />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="date" value={novaGrade.data} onChange={e => setNovaGrade({...novaGrade, data: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                      <input type="time" value={novaGrade.horario} onChange={e => setNovaGrade({...novaGrade, horario: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                      <input type="number" placeholder="Vagas" value={novaGrade.vagas} onChange={e => setNovaGrade({...novaGrade, vagas: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" required />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">PUBLICAR NO SUPABASE</button>
                  </form>
                </div>
              )}

              {currentTab === 'upload' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">Upload de Laudo ({loggedUserData?.nome})</h2>
                  <form onSubmit={handleUploadLaudo} className="space-y-4 max-w-xl">
                    <input type="text" placeholder="CPF do Paciente" value={novoLaudo.cpf} onChange={e => setNovoLaudo({...novoLaudo, cpf: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100" required />
                    <select value={novoLaudo.tipoExame} onChange={e => setNovoLaudo({...novoLaudo, tipoExame: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">
                      {TIPOS_EXAMES.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
                    </select>
                    <input type="file" accept=".pdf" onChange={e => setNovoLaudo({...novoLaudo, arquivoAnexado: e.target.files[0]})} className="w-full text-slate-300 text-xs" />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">PUBLICAR LAUDO</button>
                  </form>
                </div>
              )}

              {currentTab === 'chat_admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                  <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Fila de Mensagens</h4>
                    {dbCidadaos.filter(c => mensagensChat.some(m => m.cidadao_id === c.id)).map(cidadao => (
                      <div key={cidadao.id} onClick={() => setUsuarioChatSelecionadoPosto(cidadao.id)} className={`p-3 rounded-lg cursor-pointer border ${usuarioChatSelecionadoPosto === cidadao.id ? 'bg-slate-800 border-emerald-500' : 'bg-slate-950/60 border-slate-800'}`}>
                        <p className="text-xs font-bold text-slate-100">{cidadao.nome}</p>
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 bg-[#1a1e24] border border-slate-800 rounded-xl flex flex-col p-4">
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {mensagensChat.filter(m => m.cidadao_id === usuarioChatSelecionadoPosto).map(m => (
                        <div key={m.id} className={`flex ${m.remetente.includes('Equipe') ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-xl max-w-[80%] ${m.remetente.includes('Equipe') ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                            <p className="text-[10px] font-bold opacity-75">{m.remetente}</p>
                            <p>{m.texto}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendChatPosto} className="flex gap-2 mt-2">
                      <input type="text" placeholder="Responder..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100" />
                      <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Enviar</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalWppAutoOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 max-w-md rounded-xl p-5 text-slate-100">
            <h3 className="font-bold text-emerald-400 text-base mb-2">Notificação Enviada</h3>
            <p className="text-xs text-slate-400 mb-3 font-mono">{mensagemWppAuto}</p>
            <button onClick={() => setModalWppAutoOpen(false)} className="w-full bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}