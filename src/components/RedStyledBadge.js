import { Badge } from "@mui/material";
import { styled } from "@mui/system";

const RedStyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#b74400',
      color: '#b74400',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        content: '""',
      },
    }
  }));

export default RedStyledBadge;