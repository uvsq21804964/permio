import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'LILI',
    price: '6,85',
    description: 'Petite, mais vaillante !',
    details:
      'Idéale pour les personnes vivant seules, LILI veille sur vous en toute discrétion.',
    buttonText: "Elle est trop mignonne, je l'adopte !",
    link: '/solutions/lili',
  },
  {
    name: 'LULU',
    price: '11,25',
    description: 'Un indispensable, pour les familles !',
    details:
      //   "Parfaite pour les familles de taille moyenne, LULU envoie automatiquement des preuves de verrouillage aux membres d'un même foyer. Un vrai soulagement pour les parents qui confient une clé à leur enfant pour la première fois !",
      'Parfaite pour soulager les parents qui confient une clé à leur enfant pour la première fois !',
    buttonText: 'Rien ne lui échappe !',
    link: '/solutions/lulu',
    highlight: true,
  },
  {
    name: 'LOULOU',
    price: '17,50',
    description: 'Le plus grand, pour les grandes familles.',
    details:
      'Pensé pour les familles nombreuses, LOULOU assure un suivi en temps réel des allées et venues de tous les membres du foyer.',
    buttonText: 'Costaud comme son père !',
    link: '/solutions/loulou',
  },
];

const Plans: React.FC = () => {
  const router = useRouter();

  return (
    <div className="bg-[#f9ffc6]/80 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center flex-col">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Une solution adaptée à vos besoins
        </h2>
        <p className="mt-3 text-gray-600">
          Chaque foyer est unique, choisissez la solution qui vous convient le
          mieux.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`border rounded-lg p-6 shadow-sm bg-white ${
              plan.highlight
                ? 'border-blue-500 border-2 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {plan.price} €
            </p>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            <p className="mt-4 text-gray-700">{plan.details}</p>

            <Button
              onClick={() => router.push(plan.link)}
              className="mt-6 inline-block w-full text-center px-4 py-2 rounded-md border 
              text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-6"
            >
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>
      <br />
      🎉 SURPRISE: parce qu&apos;on vous aime bien, la livraison est offerte !
      🎉
    </div>
  );
};

export default Plans;
