import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicialização segura do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [tela, setTela] = useState('inicio'); // inicio, login_cidadao, cadastro_cidadao, painel_cidadao, login_posto, painel_posto
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [postoLogado, setPostoLogado] = useState(null);
  
  // Estados de formulário
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Estados do sistema
  const [abaCidadao, setAbaCidadao] = useState('agendar'); // agendar, status, historico, perfil
  const [abaPosto, setAbaPosto] = useState('solicitacoes'); // solicitacoes, vagas, exames, chat
  const [agendamentos, setAgendamentos] = useState([]);
  const [postos, setPostos] = useState([]);
  const [exames, setExames] = useState([]);
  
  // Formulário de agendamento
  const [postoSelecionado, setPostoSelecionado] = useState('');
  const [exameSelecionado, setExameSelecionado] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [mensagemStatus, setMensagemStatus] = useState('');

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    carregarPostosEExames();
  }, []);

  useEffect(() => {
    if (usuarioLogado) carregarAgendamentosCidadao();
    if (postoLogado) carregarAgendamentosPosto();
  }, [usuarioLogado, postoLogado]);

  async function carregarPostosEExames() {
    try {
      const { data: dataPostos } = await supabase.from('postos_saude').select('*');
      const { data: dataExames } = await supabase.from('exames').select('*');
      if (dataPostos) setPostos(dataPostos);
      if (dataExames) setExames(dataExames);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  }

  async function carregarAgendamentosCidadao() {
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cidadao_cpf', usuarioLogado.cpf);
    if (data) setAgendamentos(data);
  }

  async function carregarAgendamentosPosto() {
    const { data } = await supabase
      .from('agendamentos')
      .select('*');
    if (data) setAgendamentos(data);
  }

  // Cadastro de Cidadão
  async function handleCadastroCidadao(e) {
    e.preventDefault();
    setMensagemStatus('');
    try {
      const { error } = await supabase.from('cidadaos').insert([
        { nome, cpf, cartao_sus: cartaoSus, telefone, email: `${cpf}@medtech.bm` }
      ]);
      if (error) throw error;
      alert('Cadastro realizado com sucesso! Faça o login.');
      setTela('login_cidadao');
    } catch (err) {
      setMensagemStatus('Erro ao cadastrar cidadão: ' + err.message);
    }
  }

  // Login do Cidadão
  async function handleLoginCidadao(e) {
    e.preventDefault();
    setMensagemStatus('');
    const { data, error } = await supabase
      .from('cidadaos')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (error || !data) {
      setMensagemStatus('Cidadão não encontrado. Faça o cadastro.');
    } else {
      setUsuarioLogado(data);
      setTela('painel_cidadao');
    }
  }

  // Login do Posto de Saúde
  function handleLoginPosto(e) {
    e.preventDefault();
    setPostoLogado({ id: 1, nome: 'UBS Centro - Barra Mansa' });
    setTela('painel_posto');
  }

  // Solicitar Agendamento
  async function handleSolicitarAgendamento(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('agendamentos').insert([
        {
          cidadao_cpf: usuarioLogado.cpf,
          nome_paciente: usuarioLogado.nome,
          posto_id: postoSelecionado,
          exame_especialidade: exameSelecionado,
          data: dataAgendamento,
          hora: horaAgendamento,
          status: 'Pendente'
        }
      ]);
      if (error) throw error;
      alert('Solicitação de agendamento enviada com sucesso!');
      carregarAgendamentosCidadao();
      setAbaCidadao('status');
    } catch (err) {
      alert('Erro ao solicitar: ' + err.message);
    }
  }

  // Atualizar Status do Agendamento pelo Posto
  async function atualizarStatusAgendamento(id, novoStatus) {
    await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id);
    carregarAgendamentosPosto();
  }

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
      
      {/* CABEÇALHO */}
      <header style={{ textAlign: 'center', marginBottom: '30px', background: '#0f172a', color: '#fff', padding: '20px', borderRadius: '10px' }}>
        <h1 style={{ margin: 0 }}>MedTech BM</h1>
        <p style={{ margin: '5px 0 0 0' }}>Sistema Unificado de Agendamentos e Exames — Serra Mansa / RJ</p>
      </header>

      {/* TELA DE INÍCIO */}
      {tela === 'inicio' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '280px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Portal do Cidadão</h3>
            <p>Acesse para agendar consultas, exames e acompanhar solicitações.</p>
            <button onClick={() => setTela('login_cidadao')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
              Entrar como Cidadão
            </button>
          </div>

          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '280px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Postos de Saúde</h3>
            <p>Gestão de vagas, confirmação de horários e exames da unidade.</p>
            <button onClick={() => setTela('login_posto')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
              Entrar como Posto
            </button>
          </div>
        </div>
      )}

      {/* LOGIN CIDADÃO */}
      {tela === 'login_cidadao' && (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Login do Cidadão</h2>
          {mensagemStatus && <p style={{ color: 'red' }}>{mensagemStatus}</p>}
          <form onSubmit={handleLoginCidadao}>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              CPF:
              <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
            </label>
            <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Entrar</button>
          </form>
          <hr style={{ margin: '20px 0' }} />
          <button onClick={() => setTela('cadastro_cidadao')} style={{ width: '100%', background: '#64748b', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Não tem conta? Cadastre-se</button>
          <button onClick={() => setTela('inicio')} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: '10px', cursor: 'pointer' }}>Voltar</button>
        </div>
      )}

      {/* CADASTRO CIDADÃO */}
      {tela === 'cadastro_cidadao' && (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Cadastro de Cidadão</h2>
          {mensagemStatus && <p style={{ color: 'red' }}>{mensagemStatus}</p>}
          <form onSubmit={handleCadastroCidadao}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Nome Completo:
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>CPF:
              <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>Cartão SUS:
              <input type="text" value={cartaoSus} onChange={e => setCartaoSus(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>Telefone / WhatsApp:
              <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>
            <button type="submit" style={{ width: '100%', background: '#059669', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Finalizar Cadastro</button>
          </form>
          <button onClick={() => setTela('login_cidadao')} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: '10px', cursor: 'pointer' }}>Já tenho conta</button>
        </div>
      )}

      {/* PAINEL CIDADÃO (COMPLETO) */}
      {tela === 'painel_cidadao' && usuarioLogado && (
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* MENU LATERAL */}
          <div style={{ width: '250px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p><strong>Paciente:</strong> {usuarioLogado.nome}</p>
            <p style={{ fontSize: '12px', color: '#64748b' }}>CPF: {usuarioLogado.cpf}</p>
            <hr />
            <button onClick={() => setAbaCidadao('agendar')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaCidadao === 'agendar' ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>+ Solicitar Agendamento</button>
            <button onClick={() => setAbaCidadao('status')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaCidadao === 'status' ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>🕒 Status e Confirmação</button>
            <button onClick={() => setAbaCidadao('historico')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaCidadao === 'historico' ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>📋 Histórico de Atendimentos</button>
            <button onClick={() => setAbaCidadao('perfil')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaCidadao === 'perfil' ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>👤 Meus Dados</button>
            <button onClick={() => { setUsuarioLogado(null); setTela('inicio'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}>Sair</button>
          </div>

          {/* CONTEÚDO PRINCIPAL DO CIDADÃO */}
          <div style={{ flex: 1, background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {abaCidadao === 'agendar' && (
              <div>
                <h2>Solicitar Consulta ou Exame</h2>
                <form onSubmit={handleSolicitarAgendamento}>
                  <label style={{ display: 'block', marginBottom: '15px' }}>Unidade de Saúde:
                    <select value={postoSelecionado} onChange={e => setPostoSelecionado(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
                      <option value="">Selecione o Posto...</option>
                      {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      <option value="1">UBS Centro - Barra Mansa</option>
                      <option value="2">PSF Ano Bom</option>
                    </select>
                  </label>
                  <label style={{ display: 'block', marginBottom: '15px' }}>Especialidade / Exame:
                    <select value={exameSelecionado} onChange={e => setExameSelecionado(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
                      <option value="">Selecione o Exame/Consulta...</option>
                      {exames.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                      <option value="Consulta Clínico Geral">Consulta Clínico Geral</option>
                      <option value="Pediatria">Pediatria</option>
                      <option value="Exame de Sangue">Exame de Sangue</option>
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <label style={{ flex: 1 }}>Data preferencial:
                      <input type="date" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
                    </label>
                    <label style={{ flex: 1 }}>Horário:
                      <input type="time" value={horaAgendamento} onChange={e => setHoraAgendamento(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
                    </label>
                  </div>
                  <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Enviar Solicitação</button>
                </form>
              </div>
            )}

            {abaCidadao === 'status' && (
              <div>
                <h2>Minhas Solicitações e Status</h2>
                {agendamentos.length === 0 ? <p>Nenhum agendamento realizado.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Exame/Consulta</th>
                        <th style={{ padding: '10px' }}>Data/Hora</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentos.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px' }}>{a.exame_especialidade}</td>
                          <td style={{ padding: '10px' }}>{a.data} {a.hora}</td>
                          <td style={{ padding: '10px', color: a.status === 'Aprovado' ? 'green' : a.status === 'Recusado' ? 'red' : 'orange' }}>
                            <strong>{a.status}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {abaCidadao === 'historico' && (
              <div>
                <h2>Histórico do Paciente</h2>
                <p>Consulte aqui exames e consultas finalizadas anteriormente.</p>
              </div>
            )}

            {abaCidadao === 'perfil' && (
              <div>
                <h2>Dados Cadastrais</h2>
                <p><strong>Nome:</strong> {usuarioLogado.nome}</p>
                <p><strong>CPF:</strong> {usuarioLogado.cpf}</p>
                <p><strong>Cartão SUS:</strong> {usuarioLogado.cartao_sus}</p>
                <p><strong>Telefone:</strong> {usuarioLogado.telefone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN POSTO */}
      {tela === 'login_posto' && (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Acesso Restrito - Posto de Saúde</h2>
          <form onSubmit={handleLoginPosto}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Código da Unidade / Login:
              <input type="text" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} defaultValue="UBS-CENTRO" />
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>Senha:
              <input type="password" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} defaultValue="123456" />
            </label>
            <button type="submit" style={{ width: '100%', background: '#059669', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Entrar no Sistema</button>
          </form>
          <button onClick={() => setTela('inicio')} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: '10px', cursor: 'pointer' }}>Voltar</button>
        </div>
      )}

      {/* PAINEL POSTO DE SAÚDE (COMPLETO) */}
      {tela === 'painel_posto' && (
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          {/* MENU LATERAL DO POSTO */}
          <div style={{ width: '250px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p><strong>Posto Logado:</strong></p>
            <p style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold' }}>{postoLogado?.nome}</p>
            <hr />
            <button onClick={() => setAbaPosto('solicitacoes')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaPosto === 'solicitacoes' ? '#d1fae5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>✅ Solicitações da Unidade</button>
            <button onClick={() => setAbaPosto('vagas')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaPosto === 'vagas' ? '#d1fae5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>📅 Gestão de Vagas / Agenda</button>
            <button onClick={() => setAbaPosto('exames')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaPosto === 'exames' ? '#d1fae5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>🔬 Catálogo de Exames</button>
            <button onClick={() => setAbaPosto('chat')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: abaPosto === 'chat' ? '#d1fae5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>💬 Mensagens / Notificações</button>
            <button onClick={() => { setPostoLogado(null); setTela('inicio'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}>Sair</button>
          </div>

          {/* CONTEÚDO DO PAINEL DO POSTO */}
          <div style={{ flex: 1, background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {abaPosto === 'solicitacoes' && (
              <div>
                <h2>Solicitações Recebidas ({postoLogado?.nome})</h2>
                {agendamentos.length === 0 ? <p>Nenhuma solicitação encontrada.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Paciente</th>
                        <th style={{ padding: '10px' }}>Especialidade</th>
                        <th style={{ padding: '10px' }}>Data/Hora</th>
                        <th style={{ padding: '10px' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentos.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px' }}>{a.nome_paciente || a.cidadao_cpf}</td>
                          <td style={{ padding: '10px' }}>{a.exame_especialidade}</td>
                          <td style={{ padding: '10px' }}>{a.data} {a.hora}</td>
                          <td style={{ padding: '10px' }}>
                            {a.status === 'Pendente' ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => atualizarStatusAgendamento(a.id, 'Aprovado')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Aprovar</button>
                                <button onClick={() => atualizarStatusAgendamento(a.id, 'Recusado')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Recusar</button>
                              </div>
                            ) : (
                              <span style={{ color: a.status === 'Aprovado' ? 'green' : 'red' }}>{a.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {abaPosto === 'vagas' && (
              <div>
                <h2>Gestão de Vagas</h2>
                <p>Controle de cotas diárias de atendimento da unidade.</p>
              </div>
            )}

            {abaPosto === 'exames' && (
              <div>
                <h2>Catálogo de Exames Disponíveis</h2>
                <p>Gerencie quais procedimentos a unidade está realizando no momento.</p>
              </div>
            )}

            {abaPosto === 'chat' && (
              <div>
                <h2>Comunicação com Cidadãos</h2>
                <p>Envio de lembretes e avisos aos pacientes agendados.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}