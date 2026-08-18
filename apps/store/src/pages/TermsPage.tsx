export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">Termos de Uso</h1>
      <div className="prose prose-sm text-text-secondary space-y-4">
        <p>Ao utilizar os serviços da Pagmenos, você concorda com os seguintes termos e condições.</p>
        <h2 className="text-lg font-semibold text-text">Serviço</h2>
        <p>A Pagmenos oferece um catálogo online para facilitar pedidos, que são finalizados diretamente pelo WhatsApp com a equipe da farmácia.</p>
        <h2 className="text-lg font-semibold text-text">Preços</h2>
        <p>Os preços exibidos no site são informativos. A confirmação final do valor ocorre diretamente com a farmácia.</p>
        <h2 className="text-lg font-semibold text-text">Responsabilidade</h2>
        <p>A dispensação de medicamentos segue as normas vigentes da Anvisa e a legislação farmacêutica aplicável.</p>
        <p className="text-xs text-text-muted mt-8 italic">Este documento é um modelo e deve ser revisado por assessoria jurídica antes de uso em produção.</p>
      </div>
    </div>
  );
}
