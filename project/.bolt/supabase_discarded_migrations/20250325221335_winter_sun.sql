/*
  # Correção do trigger update_updated_at

  1. Alterações
    - Adiciona coluna updated_at nas tabelas que não a possuem
    - Atualiza o trigger update_updated_at para garantir compatibilidade
*/

-- Adicionar coluna updated_at onde necessário
DO $$ 
BEGIN
  -- Profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Recriar trigger para garantir compatibilidade
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();