#include <Map.hpp>
#include <string.h>

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

Octnode_ret Map::add(VoxelSurface lod_surface)
{
    for(int i = 0; i < OCTREE_CHUNK_NB; i++)
    {
        if(!chunks[i].is_full)
            return chunks[i].add(lod_surface);
    }

    Octnode_ret retbug;
    retbug.node = NULL;
    retbug.pos = -1;
    return retbug;
    // AJOUTER UNE EXCEPTION SI TT LES CHUNKS SONT FULL
}

void Map::draw_volume(VoxelSurface surface, vec3<int> vmin, vec3<int> vmax, OctPointer node_id, int depth)
{

    int dim = dimension>>depth;
    int hdim = dim>>1;

    if(depth > OCTREE_MAX_DEPTH) return;

    OctNode const &node = this->operator()(node_id.fullpos);


    for(int i = 0; i < 8; i++)
    {
        vec3<int> maxtmp(hdim);
        vec3<int> mintmp(0);

        if((i&1) == 1)
        {
            mintmp.z += hdim;
            maxtmp.z += hdim;
        }

        if((i&2) == 2)
        {
            mintmp.y += hdim;
            maxtmp.y += hdim;
        }

        if((i&4) == 4)
        {
            mintmp.x += hdim;
            maxtmp.x += hdim;
        }


        if(vmax.x >= mintmp.x && vmin.x <= maxtmp.x &&
           vmax.y >= mintmp.y && vmin.y <= maxtmp.y &&
           vmax.z >= mintmp.z && vmin.z <= maxtmp.z)
        {
            if(vmax.x >= maxtmp.x && vmin.x <= mintmp.x &&
               vmax.y >= maxtmp.y && vmin.y <= mintmp.y &&
               vmax.z >= maxtmp.z && vmin.z <= mintmp.z)
            {
                // METTRE CODE POUR SUPPRIMER RECURSIVEMENT LA NODE

                (*this)[node_id.fullpos].childs[i].surface = surface;
            }
            else
            {
                // RECURSIVE CALL
                OctPointer ptr = node.childs[i].ptr;

                if(!ptr.fullpos || ptr.fullpos > LEAF_LIMIT32)
                {
                    Octnode_ret pos = add(surface);
                    // std::cout << "RECURSIVE CALL" << pos.pos << "\n";

                    pos.node->lod_surface = surface;

                    for(char i = 0; i < 8; i++)
                        pos.node->childs[i].ptr = ptr;
                    
                    (*this)[node_id.fullpos].childs[i].ptr.fullpos = pos.pos;
                }

                draw_volume(surface, vmin-mintmp, vmax-mintmp, node.childs[i].ptr, depth+1);
            }
        }
    }











    // int dim = dimension>>depth;
    // int hdim = dim>>1;

    // if(depth > OCTREE_MAX_DEPTH) return;

    // OctNode const &node = this->operator()(node_id.fullpos);

    // if(vmax.x >= 0 && vmin.x <= hdim &&
    //    vmax.y >= 0 && vmin.y <= hdim &&
    //    vmax.z >= 0 && vmin.z <= hdim)
    // {
    //     if(vmax.x >= hdim && vmin.x <= 0 &&
    //        vmax.y >= hdim && vmin.y <= 0 &&
    //        vmax.z >= hdim && vmin.z <= 0)
    //     {
    //         // METTRE CODE POUR SUPPRIMER RECURSIVEMENT LA NODE

    //         this->operator[](node_id.fullpos).childs[0].surface = surface;
    //     }
    //     else
    //     {
    //         // RECURSIVE CALL
    //         OctPointer ptr = node.childs[0].ptr;

    //         if(!ptr.fullpos || ptr.fullpos&LEAF_LIMIT32)
    //         {
    //             Octnode_ret pos = add(surface);
    //             std::cout << "RECURSIVE CALL" << pos.pos << "\n";

    //             pos.node->lod_surface = surface;

    //             this->operator[](node_id.fullpos).childs[0].ptr.fullpos = pos.pos;
    //         }

    //         draw_volume(surface, vmin, vmax, node.childs[0].ptr, depth+1);
    //     }
    // }

}