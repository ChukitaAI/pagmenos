export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">Política de Privacidade</h1>
      <div className="prose prose-sm text-text-secondary space-y-4">
        <p>Esta política de privacidade descreve como a Pagmenos coleta, utiliza e protege as informações pessoais fornecidas por seus clientes.</p>
        <h2 className="text-lg font-semibold text-text">Dados coletados</h2>
        <p>Coletamos apenas os dados necessários para processar seus pedidos, como nome, e-mail, endereço de entrega e informações de contato.</p>
        <h2 className="text-lg font-semibold text-text">Uso dos dados</h2>
        <p>Seus dados são utilizados exclusivamente para processamento de pedidos, comunicação sobre seus pedidos e melhoria dos nossos serviços.</p>
        <h2 className="text-lg font-semibold text-text">Proteção</h2>
        <p>Utilizamos medidas técnicas e organizacionais para proteger seus dados pessoais contra acesso não autorizado.</p>
        <p className="text-xs text-text-muted mt-8 italic">Este documento é um modelo e deve ser revisado por assessoria jurídica antes de uso em produção.</p>
      </div>
    </div>
  );
}
