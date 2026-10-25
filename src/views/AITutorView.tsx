import React, { useState, useEffect } from 'react';
import { useVocab } from '../context/VocabContext';
import {
  correctSentenceWithTutor,
  explainGrammarWithTutor,
  chatWithTutor,
  checkTutorApiStatus,
} from '../services/tutorApi';
import { CONVERSATION_SCENARIOS, FALLBACK_GRAMMAR_TOPICS } from '../services/fallbackTutor';
import { StructuredCorrection } from '../types';
import { AudioButton } from '../components/AudioButton';
import { FrenchAccentBar } from '../components/FrenchAccentBar';
import {
  Sparkles,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Award,
  Send,
  RotateCcw,
  Bot,
  HelpCircle,
  Lightbulb,
  Cpu,
} from 'lucide-react';

export const AITutorView: React.FC = () => {
  const { items, activeItems } = useVocab();

  // Tabs: 'roleplay' | 'correction' | 'grammar'
  const [activeTab, setActiveTab] = useState<'roleplay' | 'correction' | 'grammar'>('roleplay');

  // Server API status check
  const [apiStatus, setApiStatus] = useState<{ hasApiKey: boolean; model: string }>({
    hasApiKey: false,
    model: 'checking...',
  });

  useEffect(() => {
    checkTutorApiStatus().then(setApiStatus);
  }, []);

  // ==========================================
  // TAB 1: ROLEPLAY CONVERSATION
  // ==========================================
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(CONVERSATION_SCENARIOS[0].id);
  const currentScenario = CONVERSATION_SCENARIOS.find((s) => s.id === selectedScenarioId) || CONVERSATION_SCENARIOS[0];

  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string; translation?: string; feedback?: string }>>([
    {
      role: 'tutor',
      text: currentScenario.initialMessage,
      translation: currentScenario.initialTranslation,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
    'Bonjour ! Une table pour deux personnes, s\'il vous plaît.',
    'Bonjour ! Avez-vous une table en terrasse ?',
  ]);

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const scen = CONVERSATION_SCENARIOS.find((s) => s.id === id) || CONVERSATION_SCENARIOS[0];
    setChatMessages([
      {
        role: 'tutor',
        text: scen.initialMessage,
        translation: scen.initialTranslation,
      },
    ]);
  };

  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    if (!overrideText) setChatInput('');
    setChatLoading(true);

    const updatedHistory = [...chatMessages, { role: 'user', text: textToSend }];
    setChatMessages(updatedHistory);

    try {
      const activeVocabList = activeItems.slice(0, 15).map((i) => i.french);
      const res = await chatWithTutor(updatedHistory, currentScenario.title, activeVocabList);

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: res.replyFr,
          translation: res.replyEn,
          feedback: res.feedback,
        },
      ]);
      if (res.suggestedReplies && res.suggestedReplies.length > 0) {
        setSuggestedReplies(res.suggestedReplies);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: 'Très bien ! Continuez.',
          translation: 'Very good! Continue.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ==========================================
  // TAB 2: SENTENCE CORRECTION STUDIO
  // ==========================================
  const [correctionInput, setCorrectionInput] = useState('');
  const [targetContext, setTargetContext] = useState('');
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<StructuredCorrection | null>(null);

  const handleCorrectSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionInput.trim() || correctionLoading) return;

    setCorrectionLoading(true);
    try {
      const res = await correctSentenceWithTutor(correctionInput, undefined, targetContext);
      setCorrectionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCorrectionLoading(false);
    }
  };

  // ==========================================
  // TAB 3: GRAMMAR EXPLAINER
  // ==========================================
  const [grammarTopic, setGrammarTopic] = useState('');
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState<string | null>(null);

  const handleExplainGrammar = async (topicToExplain?: string) => {
    const topic = (topicToExplain || grammarTopic).trim();
    if (!topic || grammarLoading) return;

    if (topicToExplain) setGrammarTopic(topicToExplain);
    setGrammarLoading(true);
    try {
      const activeVocabList = activeItems.slice(0, 10).map((i) => i.french);
      const res = await explainGrammarWithTutor(topic, undefined, activeVocabList);
      setGrammarResult(res.explanation);
    } catch (e) {
      console.error(e);
    } finally {
      setGrammarLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header and Engine Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Sparkles size={14} /> Personalized French Tutor
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Camille, Your French Learning Partner
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Practice real-world dialogues, get 5-point sentence feedback, and explore grammar rules in plain English.
            </p>
          </div>

          {/* AI Engine Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium">
            <Cpu size={14} className={apiStatus.hasApiKey ? 'text-indigo-600' : 'text-slate-400'} />
            <span className="text-slate-600">
              Engine:{' '}
              <strong className="text-slate-800">
                {apiStatus.hasApiKey ? 'Gemini 3.8 Flash' : 'Built-in Offline Engine'}
              </strong>
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-2 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('roleplay')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roleplay'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={16} /> Conversation Roleplay
          </button>
          <button
            onClick={() => setActiveTab('correction')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'correction'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award size={16} /> Sentence Correction Studio
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'grammar'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={16} /> Grammar Explanations
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ROLEPLAY TAB */}
      {/* ========================================================================= */}
      {activeTab === 'roleplay' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Choose an everyday French situation:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONVERSATION_SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => handleScenarioChange(scen.id)}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    selectedScenarioId === scen.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block font-bold">{scen.title}</span>
                  <span className="block text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {scen.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold opacity-80">
                      {msg.role === 'user' ? 'You' : 'Camille (Tutor)'}
                    </span>
                    {msg.role === 'tutor' && <AudioButton text={msg.text} size="sm" />}
                  </div>
                  <p className="font-medium">{msg.text}</p>
                  {msg.translation && (
                    <p className="text-xs text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                      {msg.translation}
                    </p>
                  )}
                  {msg.feedback && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-lg text-indigo-900 text-xs border border-indigo-100 font-normal">
                      💡 <strong>Tutor Tip:</strong> {msg.feedback}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                <RotateCcw className="animate-spin" size={14} /> Camille is typing a reply...
              </div>
            )}
          </div>

          {/* Suggested quick replies */}
          {suggestedReplies.length > 0 && !chatLoading && (
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1.5">
                Suggested replies in French:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedReplies.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChatMessage(sug)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
                  >
                    « {sug} »
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write your message in French to Camille..."
                disabled={chatLoading}
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send size={16} /> Send
              </button>
            </div>
            <FrenchAccentBar
              onInsert={(c) => setChatInput((prev) => prev + c)}
              className="mt-1"
            />
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SENTENCE CORRECTION STUDIO TAB */}
      {/* ========================================================================= */}
      {activeTab === 'correction' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              French Sentence Analyzer & Correction Studio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Type or paste any French sentence. The AI tutor provides comprehensive 5-point pedagogical feedback.
            </p>
          </div>

          <form onSubmit={handleCorrectSentence} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Your French sentence to check:
              </label>
              <textarea
                value={correctionInput}
                onChange={(e) => setCorrectionInput(e.target.value)}
                placeholder="e.g. Je suis allé à le supermarché pour acheter du le pain..."
                rows={3}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(c) => setCorrectionInput((prev) => prev + c)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Intended English meaning or context (optional):
              </label>
              <input
                type="text"
                value={targetContext}
                onChange={(e) => setTargetContext(e.target.value)}
                placeholder="e.g. I went to the supermarket to buy bread"
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={correctionLoading || !correctionInput.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {correctionLoading ? (
                <>
                  <RotateCcw className="animate-spin" size={16} /> Analyzing sentence...
                </>
              ) : (
                <>
                  <Award size={16} /> Analyze & Correct Sentence
                </>
              )}
            </button>
          </form>

          {/* 5-Field Structured Display */}
          {correctionResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Award size={16} /> 5-Point Pedagogical Analysis
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    correctionResult.isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {correctionResult.isCorrect ? 'Sentence Approved' : 'Corrections Suggested'}
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    1. Your Original Sentence:
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    « {correctionResult.original} »
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-emerald-600">
                    2. Corrected & Idiomatic French:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-bold text-slate-900 text-base">
                      « {correctionResult.corrected} »
                    </p>
                    <AudioButton text={correctionResult.corrected} size="sm" />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    3. English Translation:
                  </span>
                  <p className="text-slate-600 italic mt-0.5">
                    "{correctionResult.englishTranslation}"
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-indigo-600">
                    4. Plain-English Grammar Explanation:
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 mt-1">
                    {correctionResult.explanation}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    5. Additional Natural Example:
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    « {correctionResult.additionalExample} »
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GRAMMAR EXPLAINER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'grammar' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Ask Any French Grammar Question
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear explanations in plain English, with rules, common pitfalls, and practical examples.
            </p>
          </div>

          {/* Quick topic buttons */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Popular topics for beginner & intermediate learners:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FALLBACK_GRAMMAR_TOPICS).map((key) => {
                const topicData = FALLBACK_GRAMMAR_TOPICS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleExplainGrammar(topicData.title)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    {topicData.title.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExplainGrammar();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={grammarTopic}
              onChange={(e) => setGrammarTopic(e.target.value)}
              placeholder="e.g. When to use tu vs vous? Passé composé vs Imparfait? Subjunctive basics..."
              disabled={grammarLoading}
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={grammarLoading || !grammarTopic.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {grammarLoading ? (
                <RotateCcw className="animate-spin" size={16} />
              ) : (
                <Lightbulb size={16} />
              )}
              Explain
            </button>
          </form>

          {grammarResult && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Lightbulb size={16} /> Detailed Explanation
              </div>
              <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed">
                {grammarResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
