import moment from 'moment';
import 'moment/locale/bn';

export default function Waqt({ name, time }) {
   return (
      <div className="flex justify-between border rounded-xl text-xl bg-white/10 p-3 my-3 w-5/6 mx-auto">
         <span>{name}</span>
         <span>{moment(time).locale('bn').format('h:mm')}</span>
      </div>
   );
}
