export function UseDto(dtoClass: any): ClassDecorator {
  return (ctor) => {
    (ctor as any).dtoClass = dtoClass;
  };
}

