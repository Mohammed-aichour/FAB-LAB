import { useOutletContext } from 'react-router-dom';
import { BonTravailPage } from '../components/bt/BonTravailPage';

const Interventions = () => {
  const user = useOutletContext<any>();
  return <BonTravailPage user={user} />;
};

export default Interventions;
