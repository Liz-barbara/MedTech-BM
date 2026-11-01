import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão resiliente com Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [tela, setTela] = useState('inicio'); // inicio, login_cidadao, cadastro_cidadao, painel_cidadao, login_posto, painel_posto
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [postoLogado, setPostoLogado] = useState(null);

  // Formulários
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [telefone, setTelefone] = useState('');

  // Estados dos Painéis
  const [abaCidadao, setAbaCidadao] = useState('agendar');
  const [abaPosto, setAbaPosto] = useState('solicitacoes');
  const [agendamentos, setAgendamentos] = useState([]);
  const [postos, setPostos] = useState([]);
  const [exames, setExames] = useState([]);

  // Seleções do Agendamento
  const [postoSelecionado, setPostoSelecionado] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState('Consulta Médica');
  const [exameSelecionado, setExameSelecionado] = useState('');
  const [vagaSelecionada, setVagaSelecionada] = useState('');
  const [mensagemStatus, setMensagemStatus] = useState('');

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
      if (dataPostos && dataPostos.length > 0) setPostos(dataPostos);
      else setPostos([
        { id: 1, nome: 'UBS Centro - Barra Mansa' },
        { id: 2, nome: 'PSF Ano Bom' }
      ]);
      if (dataExames && dataExames.length > 0) setExames(dataExames);
      else setExames([
        { id: 1, nome: 'Clínica Geral' },
        { id: 2, nome: 'Pediatria' },
        { id: 3, nome: 'Hemograma Completo' }
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  async function carregarAgendamentosCidadao() {
    const { data } = await supabase.from('agendamentos').select('*').eq('cidadao_cpf', usuarioLogado.cpf);
    if (data) setAgendamentos(data);
  }

  async function carregarAgendamentosPosto() {
    const { data } = await supabase.from('agendamentos').select('*');
    if (data) setAgendamentos(data);
  }

  async function handleCadastroCidadao(e) {
    e.preventDefault();
    setMensagemStatus('');
    try {
      const { error } = await supabase.from('cidadaos').insert([
        { nome, cpf, cartao_sus: cartaoSus, telefone, email: `${cpf}@medtech.bm` }
      ]);
      if (error) throw error;
      alert('Cadastro realizado com sucesso! Faça login.');
      setTela('login_cidadao');
    } catch (err) {
      setMensagemStatus('Erro ao cadastrar: ' + err.message);
    }
  }

  async function handleLoginCidadao(e) {
    e.preventDefault();
    setMensagemStatus('');
    const { data, error } = await supabase.from('cidadaos').select('*').eq('cpf', cpf).single();
    if (error || !data) {
      setMensagemStatus('Cidadão não encontrado. Faça o cadastro.');
    } else {
      setUsuarioLogado(data);
      setTela('painel_cidadao');
    }
  }

  function handleLoginPosto(e) {
    e.preventDefault();
    setPostoLogado({ id: 1, nome: 'UBS Centro - Barra Mansa' });
    setTela('painel_posto');
  }

  async function handleSolicitarAgendamento(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('agendamentos').insert([
        {
          cidadao_cpf: usuarioLogado.cpf,
          nome_paciente: usuarioLogado.nome,
          posto_id: postoSelecionado || '1',
          exame_especialidade: `${tipoAtendimento} - ${exameSelecionado || 'Clínica Geral'}`,
          data: vagaSelecionada || new Date().toISOString().split('T')[0],
          hora: '08:00',
          status: 'Pendente'
        }
      ]);
      if (error) throw error;
      alert('Solicitação realizada com sucesso!');
      carregarAgendamentosCidadao();
      setAbaCidadao('status');
    } catch (err) {
      alert('Erro ao agendar: ' + err.message);
    }
  }

  async function atualizarStatusAgendamento(id, novoStatus) {
    await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id);
    carregarAgendamentosPosto();
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: tela === 'inicio' ? '#0b1120' : '#f8fafc', color: tela === 'inicio' ? '#fff' : '#1e293b' }}>
      
      {/* ---------------- TELA PRINCIPAL DE BOAS-VINDAS (LAYOUT DA IMAGEM ESCURA) ---------------- */}
      {tela === 'inicio' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          
          {/* LOGO MEDTECH BM */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V13a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2.6a.3.3 0 0 0-.3-.3H4.8z"/>
                <path d="M16.5 2.3a.3.3 0 0 0-.3.3V13a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2.6a.3.3 0 0 0-.3-.3h-5.4z"/>
                <path d="M7.5 16v2a4 4 0 0 0 8 0v-2"/>
                <circle cx="11.5" cy="20" r="2" fill="#00b4d8"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '32px', margin: '10px 0 5px 0', color: '#00b4d8', fontWeight: 'bold' }}>MedTech BM</h1>
            <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>Sistema Unificado de Agendamentos e Exames - Barra Mansa / RJ</p>
            <p style={{ color: '#cbd5e1', fontSize: '13px', letterSpacing: '1px', marginTop: '25px', fontWeight: '600' }}>SELECIONE O PERFIL DE ACESSO</p>
          </div>

          {/* CARDS DE SELEÇÃO */}
          <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '850px', width: '100%' }}>
            
            {/* PORTAL DO CIDADÃO */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#131e36', border: '1px solid #1e2d4d', borderRadius: '16px', padding: '35px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#1d2d50', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#ffffff' }}>Portal do Cidadão</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', minHeight: '40px', marginBottom: '25px' }}>
                Acesso para solicitações do SUS, agendamentos e laudos.
              </p>
              <button onClick={() => setTela('login_cidadao')} style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                ENTRAR COMO CIDADÃO
              </button>
            </div>

            {/* POSTOS DE SAÚDE */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#131e36', border: '1px solid #1b4332', borderRadius: '16px', padding: '35px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7"/></svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#ffffff' }}>Postos de Saúde</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', minHeight: '40px', marginBottom: '25px' }}>
                Gestão de vagas, aprovação de fila e envio de laudos.
              </p>
              <button onClick={() => setTela('login_posto')} style={{ width: '100%', backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                ENTRAR COMO POSTO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- LOGIN CIDADÃO ---------------- */}
      {tela === 'login_cidadao' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1120' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#131e36', padding: '35px', borderRadius: '16px', border: '1px solid #1e2d4d', color: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login do Cidadão</h2>
            {mensagemStatus && <p style={{ color: '#ef4444', fontSize: '14px' }}>{mensagemStatus}</p>}
            <form onSubmit={handleLoginCidadao}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>CPF:</label>
                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="Digite seu CPF" style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setTela('cadastro_cidadao')} style={{ backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Não tem conta? Cadastrar</button>
              <button onClick={() => setTela('inicio')} style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>Voltar ao Início</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CADASTRO CIDADÃO ---------------- */}
      {tela === 'cadastro_cidadao' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1120' }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#131e36', padding: '35px', borderRadius: '16px', border: '1px solid #1e2d4d', color: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Cadastro do Cidadão</h2>
            {mensagemStatus && <p style={{ color: '#ef4444', fontSize: '14px' }}>{mensagemStatus}</p>}
            <form onSubmit={handleCadastroCidadao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>Nome Completo:</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>CPF:</label>
                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>Cartão SUS:</label>
                <input type="text" value={cartaoSus} onChange={e => setCartaoSus(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>Telefone / WhatsApp:</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#059669', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Cadastro</button>
            </form>
            <button onClick={() => setTela('login_cidadao')} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer' }}>Já possui conta? Entrar</button>
          </div>
        </div>
      )}

      {/* ---------------- PAINEL DO CIDADÃO (LAYOUT DE BARRA AZUL DA SEGUNDA IMAGEM) ---------------- */}
      {tela === 'painel_cidadao' && usuarioLogado && (
        <div>
          {/* BARRA SUPERIOR AZUL */}
          <header style={{ backgroundColor: '#005bb5', color: '#fff', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#fff', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#005bb5', fontSize: '14px' }}>MedTechBM</div>
              <span style={{ fontSize: '14px' }}>Portal do Cidadão - Barra Mansa</span>
            </div>
            <button onClick={() => { setUsuarioLogado(null); setTela('inicio'); }} style={{ backgroundColor: '#003d7a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Sair</button>
          </header>

          {/* CORPO DO PAINEL */}
          <div style={{ display: 'flex', padding: '30px', gap: '25px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* CARD DO PACIENTE NA ESQUERDA */}
            <div style={{ width: '260px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Paciente</p>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0', color: '#0f172a' }}>{usuarioLogado.nome}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>CPF: {usuarioLogado.cpf}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setAbaCidadao('agendar')} style={{ textAlign: 'left', padding: '10px 12px', backgroundColor: abaCidadao === 'agendar' ? '#e0f2fe' : 'transparent', color: abaCidadao === 'agendar' ? '#0284c7' : '#334155', border: 'none', borderLeft: abaCidadao === 'agendar' ? '4px solid #0284c7' : 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                  + Solicitar Agendamento
                </button>
                <button onClick={() => setAbaCidadao('status')} style={{ textAlign: 'left', padding: '10px 12px', backgroundColor: abaCidadao === 'status' ? '#e0f2fe' : 'transparent', color: abaCidadao === 'status' ? '#0284c7' : '#334155', border: 'none', borderLeft: abaCidadao === 'status' ? '4px solid #0284c7' : 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                  🕒 Status e Confirmação
                </button>
              </div>
            </div>

            {/* CONTEÚDO PRINCIPAL DE AGENDAMENTO (FORMULÁRIO IGUAL À IMAGEM) */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {abaCidadao === 'agendar' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Agendar Consulta ou Exame</h2>
                  
                  <form onSubmit={handleSolicitarAgendamento}>
                    {/* SELEÇÃO DO POSTO */}
                    <div style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '8px' }}>
                        🏥 Selecione o Posto / Unidade de Saúde Desejada:
                      </label>
                      <select value={postoSelecionado} onChange={e => setPostoSelecionado(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>

                    {/* TIPO DE ATENDIMENTO E ESPECIALIDADE */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Tipo de Atendimento</label>
                        <select value={tipoAtendimento} onChange={e => setTipoAtendimento(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <option value="Consulta Médica">Consulta Médica</option>
                          <option value="Exame Laboratorial">Exame Laboratorial</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Especialidade / Exame</label>
                        <select value={exameSelecionado} onChange={e => setExameSelecionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          {exames.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* VAGAS LIBERADAS */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', marginBottom: '25px', backgroundColor: '#f8fafc' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '8px' }}>
                        Vagas liberadas para o posto [UBS Centro - Barra Mansa]:
                      </label>
                      <input type="date" value={vagaSelecionada} onChange={e => setVagaSelecionada(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <button type="submit" style={{ width: '100%', backgroundColor: '#cbd5e1', color: '#475569', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      CONFIRMAR AGENDAMENTO NA VAGA SELECIONADA
                    </button>
                  </form>
                </div>
              )}

              {abaCidadao === 'status' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Status dos Meus Agendamentos</h2>
                  {agendamentos.length === 0 ? <p style={{ color: '#64748b' }}>Nenhum agendamento realizado no momento.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Exame/Consulta</th>
                          <th style={{ padding: '10px' }}>Data</th>
                          <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendamentos.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px' }}>{a.exame_especialidade}</td>
                            <td style={{ padding: '10px' }}>{a.data}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: a.status === 'Aprovado' ? 'green' : a.status === 'Recusado' ? 'red' : 'orange' }}>
                              {a.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ---------------- LOGIN POSTO ---------------- */}
      {tela === 'login_posto' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1120' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#131e36', padding: '35px', borderRadius: '16px', border: '1px solid #1e2d4d', color: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Acesso ao Posto de Saúde</h2>
            <form onSubmit={handleLoginPosto}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Código da Unidade:</label>
                <input type="text" defaultValue="UBS-CENTRO" required style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#059669', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar no Painel</button>
            </form>
            <button onClick={() => setTela('inicio')} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer' }}>Voltar ao Início</button>
          </div>
        </div>
      )}

      {/* ---------------- PAINEL POSTO DE SAÚDE ---------------- */}
      {tela === 'painel_posto' && (
        <div>
          <header style={{ backgroundColor: '#047857', color: '#fff', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Painel Administrativo - UBS Centro (Barra Mansa)</span>
            <button onClick={() => { setPostoLogado(null); setTela('inicio'); }} style={{ backgroundColor: '#065f46', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>
          </header>

          <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '25px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Solicitações Recebidas de Pacientes</h2>
              
              {agendamentos.length === 0 ? <p style={{ color: '#64748b' }}>Nenhuma solicitação pendente.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Paciente</th>
                      <th style={{ padding: '10px' }}>Procedimento</th>
                      <th style={{ padding: '10px' }}>Data</th>
                      <th style={{ padding: '10px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{a.nome_paciente || a.cidadao_cpf}</td>
                        <td style={{ padding: '10px' }}>{a.exame_especialidade}</td>
                        <td style={{ padding: '10px' }}>{a.data}</td>
                        <td style={{ padding: '10px' }}>
                          {a.status === 'Pendente' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => atualizarStatusAgendamento(a.id, 'Aprovado')} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Aprovar</button>
                              <button onClick={() => atualizarStatusAgendamento(a.id, 'Recusado')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Recusar</button>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 'bold', color: a.status === 'Aprovado' ? 'green' : 'red' }}>{a.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}