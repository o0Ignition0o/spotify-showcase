import { useParams } from 'react-router-dom';
import {
  gql,
  useSuspenseQuery_experimental as useSuspenseQuery,
} from '@apollo/client';
import { Music } from 'lucide-react';
import { PlaylistQuery, PlaylistQueryVariables } from '../../types/api';
import CoverPhoto from '../../components/CoverPhoto';
import EntityLink from '../../components/EntityLink';
import Flex from '../../components/Flex';
import PlaceholderCoverPhoto from '../../components/PlaceholderCoverPhoto';
import useSetBackgroundColorFromImage from '../../hooks/useSetBackgroundColorFromImage';
import styles from './playlist.module.scss';
import PlaylistTable from '../../components/PlaylistTable';

const PLAYLIST_QUERY = gql`
  query PlaylistQuery($id: ID!) {
    playlist(id: $id) {
      id
      name
      images {
        url
      }
      owner {
        id
        displayName
      }
      tracks {
        edges {
          ...PlaylistTable_playlistTrackEdges
        }
        pageInfo {
          total
        }
      }
    }
  }

  ${PlaylistTable.fragments.playlistTrackEdges}
`;

const Playlist = () => {
  const { playlistId } = useParams() as { playlistId: 'string' };
  const { data } = useSuspenseQuery<PlaylistQuery, PlaylistQueryVariables>(
    PLAYLIST_QUERY,
    { variables: { id: playlistId } }
  );

  const playlist = data.playlist!;
  const { tracks } = playlist;
  const images = playlist.images ?? [];
  const coverPhoto = images[0];

  useSetBackgroundColorFromImage(coverPhoto?.url, {
    fallback: 'rgba(var(--background--surface--rgb), 0.5)',
  });

  return (
    <div className={styles.playlist}>
      <Flex
        className={styles.playlistHeader}
        as="header"
        gap="2rem"
        alignItems="end"
      >
        <CoverPhoto
          src={coverPhoto?.url}
          fallback={<PlaceholderCoverPhoto icon={Music} />}
          size="250px"
        />
        <Flex direction="column" gap="0.5rem">
          <h2 className={styles.type}>Playlist</h2>
          <h1 className={styles.playlistName}>{playlist.name}</h1>
          <Flex className={styles.playlistInfo} alignItems="center">
            <Flex alignItems="center" gap="1ch">
              <EntityLink
                className={styles.playlistOwner}
                entity={playlist.owner}
              >
                {playlist.owner.displayName}
              </EntityLink>
            </Flex>
            <span>
              {tracks.pageInfo.total}{' '}
              {tracks.pageInfo.total === 1 ? 'song' : 'songs'}
            </span>
          </Flex>
        </Flex>
      </Flex>
      <Flex className={styles.tracks} direction="column" gap="2rem" flex={1}>
        <PlaylistTable playlistTrackEdges={playlist.tracks.edges} />
      </Flex>
    </div>
  );
};

export default Playlist;
