import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hover = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg ${
        hover ? 'hover:shadow-md transition-shadow duration-200' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`px-6 py-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';
