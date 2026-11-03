import lightLogo from '../assets/brank_dark.png'
import darkLogo from '../assets/brand_logo.png'
import text from '../content/ar.json'

export default function BrandLogo() {
  return <span className="logo-frame"><img className="brand-logo logo-light" src={lightLogo} alt={text.brand} width="2048" height="683"/><img className="brand-logo logo-dark" src={darkLogo} alt={text.brand} width="2048" height="683"/></span>
}
