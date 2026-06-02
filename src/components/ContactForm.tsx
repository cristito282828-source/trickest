'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interest: '',
    message: '',
  });
  const t = useTranslations('contactForm');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Crear mensaje de WhatsApp con todos los datos
    const interestLabels: Record<string, string> = {
      skater: t('optionSkater'),
      sponsor: t('optionSponsor'),
      investor: t('optionInvestor'),
      partner: t('optionPartner'),
      press: t('optionPress'),
      other: t('optionOther'),
    };

    const message = `🛹 *NUEVA COLABORACIÓN TRICKEST*

👤 *Nombre/Empresa:* ${formData.name}
📧 *Email:* ${formData.email}
🎯 *Interés:* ${interestLabels[formData.interest] || formData.interest}

💬 *Mensaje:*
${formData.message}

🚀 _Enviado desde trickest.com_`;

    const whatsappNumber = '573002469413';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // Abrir WhatsApp con el mensaje
    window.open(whatsappUrl, '_blank');

    // Limpiar formulario
    setFormData({ name: '', email: '', interest: '', message: '' });
  };

  return (
    <div className="py-16 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header con Logo */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="relative hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="Trickest Logo"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </Link>
          </div>

          {/* Título */}
          <div className="inline-block">
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-1 rounded-lg shadow-2xl">
              <div className="bg-slate-900 rounded-lg px-8 py-6">
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider">
                  {t('title')}
                </h2>
                <p className="text-cyan-300 mt-3 text-sm md:text-base uppercase tracking-wider">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-800/80 border-4 border-cyan-500 rounded-lg p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-cyan-400"></div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2">10+</div>
            <div className="text-slate-400 text-xs uppercase font-bold">{t('levels')}</div>
          </div>
          <div className="bg-slate-800/80 border-4 border-purple-500 rounded-lg p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-purple-400"></div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2">24/7</div>
            <div className="text-slate-400 text-xs uppercase font-bold">{t('competitions')}</div>
          </div>
          <div className="bg-slate-800/80 border-4 border-pink-500 rounded-lg p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-pink-400"></div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2">∞</div>
            <div className="text-slate-400 text-xs uppercase font-bold">{t('tricks')}</div>
          </div>
          <div className="bg-slate-800/80 border-4 border-pink-400 rounded-lg p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-pink-300"></div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2">REAL</div>
            <div className="text-slate-400 text-xs uppercase font-bold">{t('progress')}</div>
          </div>
        </div>

        {/* Collaboration Form */}
        <div className="bg-slate-800/80 border-4 border-slate-700 rounded-lg p-6 md:p-8 mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            {t('collaborateTitle')}
          </h3>
          <p className="text-slate-400 mb-6">
            {t('collaborateDesc')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-slate-300 font-bold uppercase text-sm mb-2"
              >
                {t('nameLabel')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border-4 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold"
                placeholder={t('namePlaceholder')}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-slate-300 font-bold uppercase text-sm mb-2"
              >
                {t('emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border-4 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold"
                placeholder="tu@email.com"
              />
            </div>

            {/* Interest Type */}
            <div>
              <label
                htmlFor="interest"
                className="block text-slate-300 font-bold uppercase text-sm mb-2"
              >
                {t('interestLabel')}
              </label>
              <select
                id="interest"
                name="interest"
                value={formData.interest}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border-4 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold"
              >
                <option value="">{t('selectOption')}</option>
                <option value="skater">{t('optionSkater')}</option>
                <option value="sponsor">{t('optionSponsor')}</option>
                <option value="investor">{t('optionInvestor')}</option>
                <option value="partner">{t('optionPartner')}</option>
                <option value="press">{t('optionPress')}</option>
                <option value="other">{t('optionOther')}</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-slate-300 font-bold uppercase text-sm mb-2"
              >
                {t('messageLabel')}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-slate-900 border-4 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold resize-none"
                placeholder={t('messagePlaceholder')}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-wider px-6 py-4 rounded-lg border-4 border-cyan-400 shadow-lg hover:shadow-cyan-500/50 transition-all duration-200"
            >
              {t('sendWhatsApp')}
            </button>
          </form>
        </div>

        {/* Why Join Us */}
        <div className="bg-slate-800/80 border-4 border-purple-600 rounded-lg p-6 md:p-8 mb-8">
          <h3 className="text-xl font-black text-purple-400 uppercase tracking-wider mb-6">
            {t('whyJoinTitle')}
          </h3>
          <ul className="grid md:grid-cols-2 gap-4 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-2xl"></span>
              <span>{t('whyJoin1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-2xl"></span>
              <span>{t('whyJoin2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-2xl"></span>
              <span>{t('whyJoin3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400 text-2xl"></span>
              <span>{t('whyJoin4')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 text-2xl"></span>
              <span>{t('whyJoin5')}</span>
            </li>
          </ul>
        </div>

        {/* Trust Badge */}
        <div className="text-center">
          <div className="inline-block bg-slate-800/80 border-4 border-cyan-500 rounded-lg px-6 py-4">
            <p className="text-cyan-300 font-bold text-sm uppercase tracking-wider">
              {t('trustBadge')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
