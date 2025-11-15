import React from 'react';

const StatistiquesCambriolages: React.FC = () => {
  return (
    <div className="bg-gradient-to-t from-primary/90 to-primary  text-white py-16">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-6">
          Quelques chiffres inquiétants sur les cambriolages...
        </h2>
        {/* <p className="text-lg md:text-xl text-gray-300 mb-12">
            Ne laissez pas les statistiques vous surprendre. Protégez votre
            foyer dès aujourd'hui !
          </p> */}
        {/* Bloc des statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Stat 1 */}
          <div className="p-6 bg-gray-600 rounded-lg shadow-lg transition-all hover:shadow-2xl flex items-center justify-center flex-col">
            <div className="text-5xl font-bold text-yellow-300">217 000</div>
            <p className="mt-3 text-lg">
              C&apos;est le nombre de cambriolages qui ont eu lieu en France en
              2023.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Cela revient à un cambriolage toutes les{' '}
              <span className="text-yellow-300">2 minutes</span> !
            </p>
          </div>
          {/* Stat 2 */}
          <div className="p-6 bg-gray-600 rounded-lg shadow-lg transition-all hover:shadow-2xl flex items-center justify-center flex-col">
            <div className="text-5xl font-bold text-yellow-300">7 sur 10</div>
            <p className="mt-3 text-lg">
              C&apos;est la proportion de français craignant un cambriolage
              lorsqu’ils partent en vacances ou en week-end.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Il y a 15 ans, ils n’étaient que{' '}
              <span className="text-yellow-300">4 sur 10</span> à avoir cette
              crainte.
            </p>
          </div>
          {/* Stat 3 */}
          <div className="p-6 bg-gray-600 rounded-lg shadow-lg transition-all hover:shadow-2xl flex items-center justify-center flex-col">
            <div className="text-5xl font-bold text-yellow-300">86%</div>
            <p className="mt-3 text-lg">
              des cambriolages ont lieu en plein jour, quand vous êtes au
              travail ou en déplacement.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Le <span className="text-yellow-300">vendredi (15,7%)</span> et le{' '}
              <span className="text-yellow-300">lundi (15,2%)</span> sont les
              jours les plus risqués.
            </p>
          </div>
        </div>
        Source: IFOP 2021
        {/* Jours et horaires des cambriolages */}
        {/* Assurance & Indemnisation */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold">
            💰 Et pourtant… peu de foyers sont indemnisés !
          </h3>
          <p className="text-lg text-gray-300 mt-2">
            Les assurances habitation ne couvrent pas toujours le vol.
            <br />
            Beaucoup de victimes ne déclarent pas leur cambriolage, par peur des
            démarches longues et complexes qui très souvent n&apos;aboutissent
            pas. <br /> Prémunissez-vous contre les cambriolages avec{' '}
            <span className="text-yellow-300">LULU</span> !
          </p>
        </div>
        {/* CTA après les stats */}
        {/* <div className="mt-12 bg-gray-800 p-8 rounded-lg">
            <h3 className="text-2xl font-semibold">
              👉 Ne prenez pas de risques !
            </h3>
            <p className="text-lg text-gray-300 mt-2">
              Grâce à <span className="text-yellow-300">LULU</span>, protégez
              votre lieu de vie efficacement et partez l'esprit tranquille.
            </p>
            <ul className="text-lg text-gray-300 mt-4 text-left mx-auto w-max">
              <li>
                ✔️ Système de protection intelligent pour détecter les
                intrusions.
              </li>
              <li>✔️ Alerte en temps réel sur votre téléphone.</li>
              <li>
                ✔️ Dispositif dissuasif pour empêcher les cambrioleurs d'agir.
              </li>
            </ul>
            <button
              onClick={() => document.getElementById('emailInput').focus()}
              className="mt-6 px-8 py-3 bg-yellow-300 text-blue-800 font-semibold rounded-lg hover:bg-yellow-400 transition duration-300"
            >
              🚀 Découvrez notre solution
            </button>
          </div> */}
      </div>
    </div>
  );
};

export default StatistiquesCambriolages;
