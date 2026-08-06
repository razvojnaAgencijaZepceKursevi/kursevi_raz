'use client';

import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

export type ViewMode = 'grid' | 'list';

/**
 * Switches a list page between card grid and table.
 *
 * Both views show the same records — the grid is for scanning by thumbnail,
 * the table for comparing fields and acting in bulk. Neither is a subset of the
 * other, so the choice stays with the user.
 */
export default function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      // Fires with `null` when the active button is clicked again; ignoring that
      // keeps a view always selected.
      onChange={(_event, next: ViewMode | null) => next && onChange(next)}
      aria-label="Način prikaza"
    >
      <ToggleButton value="grid" aria-label="Prikaz karticama">
        <Tooltip title="Kartice">
          <GridViewOutlinedIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="list" aria-label="Prikaz tabelom">
        <Tooltip title="Tabela">
          <ViewListOutlinedIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
