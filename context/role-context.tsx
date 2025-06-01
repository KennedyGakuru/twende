import React, { createContext, useState, useContext, ReactNode } from 'react';

type Role = 'commuter' | 'driver' | 'sacco' | null;

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
}

const RoleContext= createContext<RoleContextType | undefined> (undefined);

export const  RoleProvider = ({children} : {children: ReactNode}) => {
    const [role, setRole] = useState<Role>(null);

    return (
        <RoleContext.Provider value={{role, setRole}}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if(!context) throw new Error('useRole must be used within RoleProvider');
    return context;
};