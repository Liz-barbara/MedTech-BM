import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, FileText, MessageSquare, Send, CheckCircle, 
  Upload, Plus, Download, User, Building2, Phone, 
  Check, ArrowLeft, Eye, EyeOff, Save,
  CalendarDays, Paperclip, Search, RotateCcw, Trash2, Filter, AlertCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

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

  // BANCO DE DADOS EM MEMÓRIA / ESTADOS
  const [dbCidadaos, setDbCidadaos] = useState([]);
  const [dbPostos, setDbPostos] = useState([]);
  const [gradesDisponiveis, setGradesDisponiveis] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [exames, setExames] = useState([]);
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

  // 1. CARREGAR DADOS DO SUPABASE QUANDO O UTILIZADOR AUTENTICA
  useEffect(() => {
    if (!currentUser) return;

    async function carregarDadosBanco() {
      // Buscar agendamentos
      const { data: agendamentosBd } = await supabase.from('agendamentos').select('*');
      if (agendamentosBd) setAgendamentos(agendamentosBd);

      // Buscar grades de vagas
      const { data: gradesBd } = await supabase.from('grades_vagas').select('*');
      if (gradesBd) setGradesDisponiveis(gradesBd);

      // Buscar exames
      const { data: examesBd } = await supabase.from('exames').select('*');
      if (examesBd) setExames(examesBd);

      // Buscar mensagens
      const { data: chatBd } = await supabase.from('mensagens_chat').select('*');
      if (chatBd) setMensagensChat(chatBd);
    }

    carregarDadosBanco();
  }, [currentUser]);

  // REDIRECIONADOR AUTOMÁTICO DE WHATSAPP
  const dispararNotificacaoStatus = (item, status, motivoRecusa = '') => {
    const dataBr = formatarDataBR(item.data_agendamento || item.data);
    let msg = '';
    
    if (status === 'Aprovado') {
      msg = `[MEDTECH BM - MUNICIPAL]\nOlá ${item.cidadao}!\n\nSua solicitação de ${item.especialidade} foi APROVADA!\n\nLocal: ${item.posto}\nData/Hora: ${dataBr} às ${item.horario}h\nDocumentos: RG, CPF e Cartão SUS (${item.cartaoSus || item.cartao_sus}).\n\nAcesse o portal MedTech BM para confirmar sua presença!`;
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

  // LOGINS E REGISTROS (SUPABASE)
  const handleLoginCitizen = async (e) => {
    e.preventDefault();
    const { data: users, error } = await supabase
      .from('cidadaos')
      .select('*')
      .eq('cpf', formCitizen.cpf.trim())
      .single();

    if (error || !users) return alert('CPF não cadastrado!');
    if (users.cartao_sus.trim() !== formCitizen.cartaoSus.trim()) return alert('ERRO: Cartão SUS não corresponde ao CPF!');
    if (users.senha_hash !== formCitizen.senha) return alert('Senha incorreta!');

    setLoggedUserData(users);
    setCurrentUser('citizen');
    setCurrentTab('solicitar');
  };

  const handleRegisterCitizen = async (e) => {
    e.preventDefault();
    if (!formCitizen.lgpdAceite) return alert('Aceite a LGPD para continuar.');

    const { data, error } = await supabase.from('cidadaos').insert([{
      nome: formCitizen.nome,
      cpf: formCitizen.cpf,
      cartao_sus: formCitizen.cartaoSus,
      email: formCitizen.email,
      telefone: formCitizen.telefone,
      notificacao_pref: formCitizen.notificacaoPref,
      senha_hash: formCitizen.senha,
      lgpd_aceite: formCitizen.lgpdAceite
    }]).select();

    if (error) return alert('Erro ao cadastrar cidadão: ' + error.message);

    alert('Cadastro efetuado com sucesso! Efetue login.');
    setAuthMode('login');
  };

  const handleLoginAdmin = async (e) => {
    e.preventDefault();
    const { data: postos, error } = await supabase
      .from('postos_saude')
      .select('*')
      .eq('usuario', formAdmin.usuario.trim())
      .single();

    if (error || !postos || postos.senha_hash !== formAdmin.senha) return alert('Credenciais inválidas para o posto!');

    setLoggedUserData(postos);
    setCurrentUser('admin');
    setCurrentTab('fila_admin');
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!formAdmin.lgpdAceite) return alert('Aceite os termos de segurança.');

    const { error } = await supabase.from('postos_saude').insert([{
      unidade: formAdmin.unidade,
      usuario: formAdmin.usuario,
      senha_hash: formAdmin.senha
    }]);

    if (error) return alert('Erro ao cadastrar posto: ' + error.message);

    alert('Posto cadastrado com sucesso!');
    setAuthMode('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfile(null);
    setLoggedUserData(null);
    setAuthMode('login');
  };

  // APROVAR / REPROVAR COM MOTIVO
  const handleAprovarSolicitacao = async (item) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'Aprovado' })
      .eq('id', item.id);

    if (!error) {
      setAgendamentos(agendamentos.map(a => a.id === item.id ? { ...a, status: 'Aprovado' } : a));
      dispararNotificacaoStatus(item, 'Aprovado');
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

    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'Recusado', motivo_recusado: textoMotivoRecusa })
      .eq('id', agendamentoRecusaId);

    if (!error) {
      setAgendamentos(agendamentos.map(a => a.id === agendamentoRecusaId ? { ...a, status: 'Recusado', motivo_recusado: textoMotivoRecusa } : a));
      setModalRecusaOpen(false);
      dispararNotificacaoStatus(itemRecusado, 'Recusado', textoMotivoRecusa);
    }
  };

  // CONFIRMAÇÃO E DESISTÊNCIA DO CIDADÃO
  const handleConfirmarPresencaCidadao = async (id) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ confirmacao_cidadao: 'confirmado' })
      .eq('id', id);

    if (!error) {
      setAgendamentos(agendamentos.map(a => a.id === id ? { ...a, confirmacao_cidadao: 'confirmado' } : a));
      alert('Sua presença foi CONFIRMADA!');
    }
  };

  const handleOpenModalDesistencia = (id) => {
    setAgendamentoDesistenciaId(id);
    setTextoDesistencia('');
    setModalDesistenciaOpen(true);
  };

  const handleSalvarDesistencia = async (e) => {
    e.preventDefault();
    if (!textoDesistencia.trim()) return alert('Informe a justificativa do cancelamento.');

    const { error } = await supabase
      .from('agendamentos')
      .update({ 
        confirmacao_cidadao: 'desistiu', 
        justificativa_desistencia: textoDesistencia, 
        status: 'Cancelado pelo Cidadão' 
      })
      .eq('id', agendamentoDesistenciaId);

    if (!error) {
      setAgendamentos(agendamentos.map(a => a.id === agendamentoDesistenciaId ? { ...a, confirmacao_cidadao: 'desistiu', status: 'Cancelado pelo Cidadão' } : a));
      setModalDesistenciaOpen(false);
      alert('Desistência registrada!');
    }
  };

  // SOLICITAR AGENDAMENTO COM SUPABASE E BLOQUEIO DE DUPLICIDADE POR CPF
  const handleSolicitarAgendamento = async (e) => {
    e.preventDefault();
    if (!solicitacao.gradeIdSelecionada) return alert('Por favor, selecione uma vaga na lista.');
    
    const gradeEscolhida = gradesDisponiveis.find(g => g.id === parseInt(solicitacao.gradeIdSelecionada));

    // VERIFICAÇÃO DE DUPLICIDADE
    const jaPossuiAgendamentoMesmoHorario = agendamentos.some(a => 
      a.cpf === loggedUserData.cpf && 
      (a.data === gradeEscolhida.data || a.data_agendamento === gradeEscolhida.data) && 
      a.horario === gradeEscolhida.horario &&
      a.status !== 'Recusado' && 
      a.status !== 'Cancelado pelo Cidadão'
    );

    if (jaPossuiAgendamentoMesmoHorario) {
      return alert(`⚠️ BLOQUEIO DE DUPLICIDADE: O CPF ${loggedUserData.cpf} já possui uma solicitação ativa no dia ${formatarDataBR(gradeEscolhida.data)} às ${gradeEscolhida.horario}h!`);
    }

    const { data, error } = await supabase.from('agendamentos').insert([{
      cidadao_id: loggedUserData.id,
      posto: solicitacao.posto,
      tipo: solicitacao.tipo,
      especialidade: solicitacao.especialidade,
      data_agendamento: gradeEscolhida.data,
      horario: gradeEscolhida.horario,
      status: 'Pendente',
      cidadao: loggedUserData.nome,
      cpf: loggedUserData.cpf,
      cartao_sus: loggedUserData.cartao_sus || loggedUserData.cartaoSus
    }]).select();

    if (error) return alert('Erro ao salvar no banco: ' + error.message);

    setAgendamentos([...agendamentos, data[0]]);
    alert(`Solicitação enviada para a unidade: ${solicitacao.posto}! Aguarde aprovação.`);
  };

  // EXCLUIR VAGA DA GRADE PELO POSTO
  const handleExcluirGrade = async (id) => {
    if (window.confirm('Deseja remover esta vaga da grade disponibilizada?')) {
      const { error } = await supabase.from('grades_vagas').delete().eq('id', id);
      if (!error) {
        setGradesDisponiveis(gradesDisponiveis.filter(g => g.id !== id));
      }
    }
  };

  // FILTRAGENS
  const solicitacoesDoPosto = agendamentos.filter(a => a.posto === loggedUserData?.unidade);
  const pacientesComAtendimentoHumanoDoPosto = dbCidadaos.filter(cidadao => 
    mensagensChat.some(m => m.cpf === cidadao.cpf && m.postoDestino === loggedUserData?.unidade && m.solicitouHumano)
  );

  const gradesDoPostoFiltradas = gradesDisponiveis.filter(g => {
    if (g.posto !== loggedUserData?.unidade) return false;
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
                    <div className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={formCitizen.lgpdAceite} onChange={e => setFormCitizen({...formCitizen, lgpdAceite: e.target.checked})} /> Aceito os termos da LGPD</div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">CADASTRAR</button>
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
                            <span className="text-xs text-slate-500 font-bold">{formatarDataBR(item.data_agendamento || item.data)} às {item.horario}h</span>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-base mt-1">{item.especialidade}</h4>
                          <p className="text-xs text-slate-600 font-medium">Unidade: {item.posto}</p>
                        </div>

                        {item.status === 'Aprovado' && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 shrink-0">
                            <p className="text-[11px] font-bold text-slate-700 text-center">Confirmar presença (1 dia antes)?</p>
                            
                            {item.confirmacao_cidadao === 'confirmado' ? (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded text-center flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Presença Confirmada
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleConfirmarPresencaCidadao(item.id)} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded font-bold">
                                  SIM, VOU
                                </button>
                                <button onClick={() => handleOpenModalDesistencia(item.id)} className="bg-rose-600 text-white text-xs px-3 py-1.5 rounded font-bold">
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
            </div>

            <div className="md:col-span-3">
              {currentTab === 'fila_admin' && (
                <div className="bg-[#1a1e24] rounded-xl border border-slate-800 p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-3">
                    Solicitações Recebidas ({loggedUserData?.unidade})
                  </h2>
                  
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead>
                      <tr className="bg-slate-800/60 border-b border-slate-700 text-xs">
                        <th className="p-3">Paciente</th>
                        <th className="p-3">Especialidade</th>
                        <th className="p-3">Data/Hora</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {solicitacoesDoPosto.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold">{item.cidadao}</td>
                          <td className="p-3">{item.especialidade}</td>
                          <td className="p-3 text-xs text-emerald-400">{formatarDataBR(item.data_agendamento || item.data)} às {item.horario}h</td>
                          <td className="p-3 text-center">
                            {item.status === 'Pendente' && (
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleAprovarSolicitacao(item)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold">Aprovar</button>
                                <button onClick={() => handleOpenModalRecusa(item.id)} className="bg-rose-600 text-white px-2.5 py-1 rounded text-xs font-bold">Recusar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}