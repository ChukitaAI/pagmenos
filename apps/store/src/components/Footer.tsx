import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/queries';

export default function Footer() {
  const { data: settings } = useStoreSettings();

  return (
    <footer className="bg-surface border-t border-border py-8 px-4 mb-16 lg:mb-0">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg text-text mb-2">Pag<span className="text-brand-500">menos</span></h3>
            {settings?.street && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {settings.street}, {settings.number}<br />
                {settings.district}, {settings.city} - {settings.state}<br />
                {settings.zip_code && `CEP: ${settings.zip_code}`}
              </p>
            )}
            {settings?.phone && (
              <p className="text-sm text-text-secondary mt-1">Tel: {settings.phone}</p>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-text mb-2">Informações</h4>
            <ul className="space-y-1.5">
              <li><Link to="/privacidade" className="text-sm text-text-secondary hover:text-brand-600 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="text-sm text-text-secondary hover:text-brand-600 transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* WhatsApp */}
          <div>
            <h4 className="font-semibold text-sm text-text mb-2">Atendimento</h4>
            {settings?.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} {settings?.store_name || 'Pagmenos'}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
