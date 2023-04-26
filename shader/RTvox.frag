#version 450

// precision lowp float;

layout (location = 0) uniform ivec2 iResolution;
layout (location = 1) uniform float iTime;
layout (location = 2) uniform vec3 CameraPositon;
layout (location = 3) uniform vec2 MousePositon;
layout (location = 4) uniform float FOV;

struct OctNode
{
    uint col;
    int  childs[8];
    int  parent;
};

#define OCTREE_CHUNK_SIZE 0xFFFF
// layout (std430, binding=2) readonly restrict buffer shader_data
layout (std430, binding=2) readonly buffer shader_data
{
    OctNode World[OCTREE_CHUNK_SIZE];
};
// OctNode World[32];

out vec4 frag_color;

#define PI 3.14159265359
#define MAXSD 200000.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3
#define MAX_OCTDEPTH 10

const uint LEAF_LIMIT = uint(0x80000000);

vec2 uv;
vec3 camdir = vec3(0.0, 0.0, 0.0);
vec3 icamdir;
vec3 campos = CameraPositon;

struct Surface
{
    float sd; // signed distance value
    uint col;
    lowp int side;
};

struct trace_recstat
{
    Surface subvoxels[4];
    vec3 suborigin[4];
    int nodes[4];
    float size;
    int curNode;
    // OctNode node;

    //lowp int sorted_id[8];
};

trace_recstat stack[MAX_OCTDEPTH];

// trace_recstat stack[MAX_OCTDEPTH] = {
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0}
//     };

uint getvoxcnt = 0;

Surface getvox(const vec3 pos, const float hsize)
{
    getvoxcnt ++;

    vec3 maxp = pos + hsize;
    vec3 minp = pos - hsize;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    Surface return_val;
    return_val.sd = MAXSD;

    // https://tavianator.com/2011/ray_box.html

    float tx1 = minpicd.x+cpicd.x;
    float tx2 = maxpicd.x+cpicd.x;
    float tmin = min(tx1, tx2);
    float tmax = max(tx1, tx2);

    float ty1 = minpicd.y+cpicd.y;
    float ty2 = maxpicd.y+cpicd.y;
    tmin = max(tmin, min(ty1, ty2));
    tmax = min(tmax, max(ty1, ty2));

    float tz1 = minpicd.z+cpicd.z;
    float tz2 = maxpicd.z+cpicd.z;
    tmin = max(tmin, min(tz1, tz2));
    tmax = min(tmax, max(tz1, tz2));



    if(tmax >= tmin && tmax > 0.0)
        return_val.sd = tmin;
    else 
        return return_val;
    
    if(return_val.sd == tx1 ||return_val.sd == tx2)
        return_val.side = voxside_x;

    if(return_val.sd == ty1 ||return_val.sd == ty2)
        return_val.side = voxside_y;

    if(return_val.sd == tz1 ||return_val.sd == tz2)
        return_val.side = voxside_z;

    return return_val;
}

Surface getvox_old2(const vec3 pos, const float size)
{
    getvoxcnt ++;
    vec3 maxp = pos + size*0.5;
    vec3 minp = pos - size*0.5;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    vec3 p;
    float t;

    Surface return_val;
    return_val.sd = MAXSD;

    //////////////// X //////////////
    t = minpicd.x + cpicd.x;
    p.yz = campos.yz + t*camdir.yz;
    if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_x;
    }
    t = maxpicd.x + cpicd.x;
    p.yz = campos.yz + t*camdir.yz;
    if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_x;
    }

    //////////////// Y //////////////

    t = maxpicd.y + cpicd.y;
    p.xz = campos.xz + t*camdir.xz;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_y;
    }

    t = minpicd.y + cpicd.y;
    p.xz = campos.xz + t*camdir.xz;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_y;
    }

    //////////////// Z //////////////
    t = minpicd.z + cpicd.z;
    p.xy = campos.xy + t*camdir.xy;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        return_val.sd = t;
        return_val.side = voxside_z;
    }

    t = maxpicd.z + cpicd.z;
    p.xy = campos.xy + t*camdir.xy;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        return_val.sd = t;
        return_val.side = voxside_z;
    }

    // if(return_val.sd < 0.0)
    //     return_val.sd = MAXSD;

    return return_val;
}

Surface getvox_old(const vec3 pos, const float size)
{
    vec3 maxp = pos + size*0.5;
    vec3 minp = pos - size*0.5;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    vec3 p;
    float t;

    Surface return_val;
    return_val.sd = MAXSD;

    //////////////// X //////////////
    if(camdir.x > 0.0)
    {
        t = minpicd.x + cpicd.x;
        p.yz = campos.yz + t*camdir.yz;
        if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_x;
        }
    }
    else
    {
        t = maxpicd.x + cpicd.x;
        p.yz = campos.yz + t*camdir.yz;
        if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_x;
        }
    }

    //////////////// Y //////////////
    if(camdir.y < 0.0)
    {
        t = maxpicd.y + cpicd.y;
        p.xz = campos.xz + t*camdir.xz;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_y;
        }
    }
    else
    {
        t = minpicd.y + cpicd.y;
        p.xz = campos.xz + t*camdir.xz;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_y;
        }

    }

    //////////////// Z //////////////
    if(camdir.z > 0.0)
    {
        t = minpicd.z + cpicd.z;
        p.xy = campos.xy + t*camdir.xy;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
        {
            return_val.sd = t;
            return_val.side = voxside_z;
        }
    }
    else
    {
        t = maxpicd.z + cpicd.z;
        p.xy = campos.xy + t*camdir.xy;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
        {
            return_val.sd = t;
            return_val.side = voxside_z;
        }
    }

    return return_val;
}

mat3 camera(vec3 cameraPos, vec3 lookAtPoint) {
	vec3 cd = normalize(lookAtPoint - cameraPos); // camera direction
	vec3 cr = normalize(cross(vec3(0, 1, 0), cd)); // camera right
	vec3 cu = normalize(cross(cd, cr)); // camera up
	
	return mat3(-cr, cu, -cd);
}

// Rotate around a circular path
mat2 rotate2d(float theta) {
  float s = sin(theta), c = cos(theta);
  return mat2(c, -s, s, c);
}

void getSubVoxels(int depth, vec3 origin, float size)
{
    float hsize = size*0.5;
    float qsize = size*0.25;

    stack[depth].size = hsize;

    OctNode node = World[stack[depth].curNode];

    // INITIALIZATION
    int cnt = 0;
    lowp int id[4];
    Surface sd[4];
    sd[0].sd = MAXSD;
    sd[1].sd = MAXSD;
    sd[2].sd = MAXSD;
    sd[3].sd = MAXSD;
    id[0] = 0;
    id[1] = 0;
    id[2] = 0;
    id[3] = 0;

    vec3 suborigin[8];
    suborigin[0] = vec3(origin.x - qsize, origin.y - qsize, origin.z - qsize);
    suborigin[1] = vec3(origin.x - qsize, origin.y - qsize, origin.z + qsize);
    suborigin[2] = vec3(origin.x - qsize, origin.y + qsize, origin.z - qsize);
    suborigin[3] = vec3(origin.x - qsize, origin.y + qsize, origin.z + qsize);
    suborigin[4] = vec3(origin.x + qsize, origin.y - qsize, origin.z - qsize);
    suborigin[5] = vec3(origin.x + qsize, origin.y - qsize, origin.z + qsize);
    suborigin[6] = vec3(origin.x + qsize, origin.y + qsize, origin.z - qsize);
    suborigin[7] = vec3(origin.x + qsize, origin.y + qsize, origin.z + qsize);

    Surface t;

    // GETTING COLLISION WITH RAY
    if(node.childs[0] != 0)
    {
        t = getvox(suborigin[0], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 0;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[1] != 0)
    {
        t = getvox(suborigin[1], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 1;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[2] != 0)
    {
        t = getvox(suborigin[2], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 2;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[3] != 0)
    {
        t = getvox(suborigin[3], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 3;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[4] != 0)
    {
        t = getvox(suborigin[4], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 4;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[5] != 0)
    {
        t = getvox(suborigin[5], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 5;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[6] != 0)
    {
        t = getvox(suborigin[6], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 6;
            sd[cnt] = t;
            cnt++;
        }
    }
    if(node.childs[7] != 0)
    {
        t = getvox(suborigin[7], qsize);

        if(t.sd != MAXSD)
        {
            id[cnt] = 7;
            sd[cnt] = t;
            cnt++;
        }
    }


    // SORTING RESULT
    if(sd[0].sd > sd[1].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[1]; sd[1] = tmp;
        lowp int stmp = id[0]; id[0] = id[1]; id[1] = stmp;
    }
    if(sd[2].sd > sd[3].sd)
    {
        Surface   tmp = sd[2]; sd[2] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[2]; id[2] = id[3]; id[3] = stmp;
    }
    if(sd[0].sd > sd[2].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[2]; sd[2] = tmp;
        lowp int stmp = id[0]; id[0] = id[2]; id[2] = stmp;
    }
    if(sd[1].sd > sd[3].sd)
    {
        Surface   tmp = sd[1]; sd[1] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[1]; id[1] = id[3]; id[3] = stmp;
    }
    if(sd[1].sd > sd[2].sd)
    {
        Surface   tmp = sd[1]; sd[1] = sd[2]; sd[2] = tmp;
        lowp int stmp = id[1]; id[1] = id[2]; id[2] = stmp;
    }

    // APPLYING SORTED RESULT
    for(int i = 0; i < 4; i++)
    {
        stack[depth].subvoxels[i] = sd[i];
        if(sd[i].sd < MAXSD)
        {
            stack[depth].suborigin[i] = suborigin[id[i]];
            stack[depth].nodes[i] = node.childs[id[i]];
        }
    }
}

Surface trace(vec3 origin, float size, int depth)
{
    getSubVoxels(0, origin, size);
    int i[MAX_OCTDEPTH+1];
    
    i[0] = 0;

    Surface voxel;
    voxel.sd = MAXSD;

    stack[depth].curNode = 0;

    for(i[depth] = 0; i[depth] < 4; i[depth]++)
    {
        Surface csvoxel = stack[depth].subvoxels[i[depth]];
        if(csvoxel.sd < voxel.sd)
        {
            // if(depth == MAX_OCTDEPTH || csvoxel.sd > 100000.0)
            // int maxd = MAX_OCTDEPTH ;

            int maxd = MAX_OCTDEPTH - int(distance(stack[depth].suborigin[i[depth]], campos)/5000.0);
            if(maxd < 4) maxd = 4;

            if(depth >= maxd)
            {   
                csvoxel.col = World[stack[depth].curNode].col;
                return csvoxel;
            }

            uint col = uint(stack[depth].nodes[i[depth]]);

            // if(depth == MAX_OCTDEPTH || node.is_leaf)
            if(col >= LEAF_LIMIT)
            {
                csvoxel.col = col;
                return csvoxel;
            }

            else
            {
                stack[depth+1].curNode = stack[depth].nodes[i[depth]];
                getSubVoxels(depth+1, stack[depth].suborigin[i[depth]], stack[depth].size);
                depth++;
                i[depth] = -1;
            }
        }

        if(depth > 0 && i[depth] == 3)
        {
            // i[depth] = -1;
            depth--;
        }
    }

    return voxel;
}
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// given spherical coordinates (theta, phi) of a normal vector (OR longitude and latitude)
// find the normal vector, and two vectors that are perpendicular to it (and each other)
// that lie on the plane defined by the normal vector
void findUV(in float th, in float ph, out vec3 dir, out vec3 u, out vec3 v) {
	dir = vec3(sin(th)*cos(ph), cos(th), sin(th)*sin(ph));
	// Second direction, V of the plane, is PI/2 upwards towards the north pole
	float thV, phV;
	if(th < 0.5*PI) {
		thV = 0.5*PI - th;
		phV = mod(ph + PI, 2.0*PI);
	} else {
		thV = th - 0.5*PI;
		phV = ph;
	}
	v = vec3(sin(thV)*cos(phV), cos(thV), sin(thV)*sin(phV));
	// Third direction, U of plane, is perpendicular to both
	u = cross(dir, v);
}

// the bad example from IQ's article, Haha!
// https://iquilezles.org/articles/noacos
mat3 rotationAxisAngle( vec3 v, float angle )
{
    float s = sin( angle );
    float c = cos( angle );
    float ic = 1.0 - c;

    return mat3( v.x*v.x*ic + c,     v.y*v.x*ic - s*v.z, v.z*v.x*ic + s*v.y,
                 v.x*v.y*ic + s*v.z, v.y*v.y*ic + c,     v.z*v.y*ic - s*v.x,
                 v.x*v.z*ic - s*v.y, v.y*v.z*ic + s*v.x, v.z*v.z*ic + c );
}

void main()
{
    frag_color = vec4(0.0);

    // if(noise1(gl_FragCoord.x) >= 0.0)
    // {
    //     frag_color = vec4(1.0);
    //     return;
    // }

    // if(int(iTime*1000.0)%2 == 0)
    // {
    //     if(int(gl_FragCoord.x)%2 == 0)
    //         discard;

    //     if(int(gl_FragCoord.y)%2 == 0)
    //         discard;
    // }
    // else
    // {
    //     if(int(gl_FragCoord.x)%2 != 0)
    //         discard;

    //     if(int(gl_FragCoord.y)%2 != 0)
    //         discard; 
    // }

    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    // // vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    // vec2 mouseUV = vec2(0.5, 0.75);
    // // mouseUV.x -= iTime*0.1;
    // // mouseUV.y = iTime*0.1;
    vec2 mouseUV = MousePositon/iResolution.xy;
    vec4 backgroundColor = vec4(101.f, 194.f, 245.f, 256.f)/256.f;

    // vec3 col = vec3(0);
    // vec3 lp = vec3(0, 0, 0); // lookat point (aka camera target)
    // // lp.x = cos(iTime)*5000.0;
    // // lp.z = sin(iTime)*5000.0;
    // vec3 ro = vec3(3, 10, 10); // ray origin that represents camera position

    // // float cameraRadius = 1.0;
    // float cameraRadius = 7000.0;
    // ro.yz = ro.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    // ro.xz = ro.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(lp.x, lp.z);

    // vec3 rd = camera(ro, lp) * normalize(vec3(uv, -1)); // ray direction

    // ro.zy = ro.yz;
    // rd.zy = rd.yz;

    // // campos.x = cos(iTime)*50000.0;
    // campos += ro;
    // camdir = rd;
    // icamdir = 1.0/camdir;



    // mouseUV = vec2(981.0, 296.0)/iResolution.xy;

    uv += 0.5;
    mouseUV *= 2.0;
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    // https://www.shadertoy.com/view/4sj3WK
	// Camera (My own attempt of preparing a camera. Use at your own risk!)
	vec3 ro = vec3( 50000.0, 0.0, 0.0); // origin
    // vec3 ro = CameraPositon;


	float cTheta = mouseUV.y*PI; // polar theta of direction
    float cPhi = mouseUV.x*PI; // polar phi of direaction


	// float cAlpha = 0.1*PI*cos(iTime); // tilt
    float cAlpha = 0.0;
	//float FOV = 1.0; // smaller number wider view and vice versa.
	// direct the camera at given latitude and longitude
	vec3 cDir, cU, cV;
	findUV(cTheta, cPhi, cDir, cU, cV);	
	// // Tilt the camera
	mat3 tilt = rotationAxisAngle(cDir, cAlpha);
	cU = tilt*cU; // just rotate camera U and V. Yay, tt works!
	cV = tilt*cV;	
	vec2 scan = (-1.0+2.0*uv)*vec2(1.78, 1.0); // magical numbers
	vec3 rd = normalize(scan.x * cU + scan.y * cV + FOV*cDir);
	//vec3 rd = normalize(vec3( (-1.0+2.0*uv)*vec2(1.78, 1.0), -1.0));






    // https://www.shadertoy.com/view/ld23DV
	// vec2 p = (2.0*gl_FragCoord.xy-iResolution.xy) / iResolution.y;
    // vec2 p = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;

    //  // camera movement	
	// float an = 0.4*iTime;
	// // vec3 ro = vec3( 2.5*cos(an), 1.0, 2.5*sin(an) );
    // vec3 ro = CameraPositon;
    // // vec3 ro = vec3(0.0);
    // vec3 ta = vec3( 0.0, 0.8, 0.0 );
    // // vec3 ta = CameraPositon;

    // // camera matrix
    // vec3 ww = normalize( ta - ro );
    // vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    // vec3 vv = normalize( cross(uu,ww));
	// // create view ray
	// vec3 rd = normalize( p.x*uu + p.y*vv + 2.0*ww );

    campos += ro;
    camdir = rd;
    icamdir = 1.0/camdir;







    vec3 worldorigin = vec3(0.0);
    float worldsize = 150000.0;

    // check if the ray is out of the world
    Surface world = getvox(worldorigin, worldsize*0.5);
    if(world.sd == MAXSD)
    {
        frag_color = backgroundColor;
        return;
    }

    Surface voxel = trace(worldorigin, worldsize, 0);

    if(voxel.sd < MAXSD)
    {
        //// getting voxel color
        // voxel.col = uint(voxel.sd);
        // uint r = (voxel.col>>uint(16))%uint(256);
        // uint g = (voxel.col>>uint(8))%uint(256);
        // uint b = (voxel.col)%uint(256);
        // vec3 vcol = vec3(float(r), float(g), float(b))/256.0;

        //// cool depth visualisation
        // r = uint(voxel.sd/512.0);
        // g = 175;
        // b = 175;
        // vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);

        //// getvoxls calls vizualisation
        uint r = getvoxcnt;
        uint g = 175;
        uint b = 175;
        vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);

        frag_color.rgb = vcol;

        vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
        switch(voxel.side)
        {
            case voxside_x : frag_color *= voxside_colodr.x; break;
            case voxside_y : frag_color *= voxside_colodr.y; break;
            case voxside_z : frag_color *= voxside_colodr.z; break;
        }

    }
    else
    {
        uint r = getvoxcnt;
        uint g = 175;
        uint b = 175;
        vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);
        frag_color.rgb = vcol;
        // frag_color = backgroundColor;
    }

    // campos += camdir*voxel.sd;
    // camdir = normalize(vec3(0.5, 0.1, 0.5));
    // Surface shadow = trace(worldorigin, worldsize, 0);
    // if(shadow.sd < MAXSD)
    //     frag_color *= 0.25;

    frag_color.a = 1.0;
}

///// BENCH
// 11 : 13 ms
// 11 : 95 fps 10-11 ms
// 11 : 100 fps 9-10 ms
// 11 : 144 fps 7 ms => cap atteint

// 13 : 102 fps 10-9 ms

// 16 : 47fps 20-21ms 
// 16 : 56fps 18ms 
// 16 : 144fps 7ms 

// 25 : 80fps 13ms