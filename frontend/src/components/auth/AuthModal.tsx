'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useUIStore } from '@/store/uiStore';

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC = () => {
  const { isLoginModalOpen, isRegisterModalOpen, setLoginModalOpen, setRegisterModalOpen } = useUIStore();

  const isOpen = isLoginModalOpen || isRegisterModalOpen;
  const currentMode = isLoginModalOpen ? 'login' : 'register';

  const handleClose = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  const handleSuccess = () => {
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      {currentMode === 'login' ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </Modal>
  );
}; 