import { Provider } from 'react-redux';
import { store } from 'redux/store';
import { RoleProvider } from '../context/role-context';
import '../global.css';
import { SupabaseAuthProvider } from 'context/supabase-auth-provider';
import InnerLayout from './inner-layout';


export default function RootLayout() {
  return (
    <Provider store={store}>
      <SupabaseAuthProvider>
      <RoleProvider>
        <InnerLayout />
      </RoleProvider>
      </SupabaseAuthProvider>
    </Provider>
    
  );
}
