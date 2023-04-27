#include <Map.hpp>

OctNode& Map::operator[](int id)
{
    int cid = id&CHUNK_ID_MASK;

    if(!chunks[cid].nodes) chunks[cid].alloc();

    return chunks[cid].nodes[id&INCHUNK_POS_MASK];
}

void Map::send_to_gpu()
{
    for(int i = 0; i < OCTREE_CHUNK_NB; i++)
    {
        chunks[i].send_to_gpu();
    }
}