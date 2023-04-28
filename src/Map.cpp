#include <Map.hpp>

OctNode& Map::operator[](int id)
{
    int cid = id&CHUNK_ID_MASK;
    
    static_octree_buffer &sob = chunks[cid];

    if(!sob.nodes) sob.alloc();

    if(id < sob.uinterval_beg) sob.uinterval_beg = id; 
    if(id > sob.uinterval_end) sob.uinterval_end = id; 

    return sob.nodes[id&INCHUNK_POS_MASK];
}

const OctNode& Map::operator()(int id) const
{
    return chunks[id&CHUNK_ID_MASK].nodes[id&INCHUNK_POS_MASK];
}

void Map::send_to_gpu()
{
    for(int i = 0; i < OCTREE_CHUNK_NB; i++)
    {
        chunks[i].send_to_gpu();
    }
}

void Map::send_update()
{
    for(int i = 0; i < OCTREE_CHUNK_NB; i++)
    {
        chunks[i].send_update();
    }
}