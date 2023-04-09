#define PI 3.14159265359
#define MAXSD 99999.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3

vec2 uv;
vec3 camdir = vec3(0.0, 0.0, 0.0);
vec3 icamdir;
vec3 campos = vec3(-2.f, -5, -20);

struct Surface
{
    float sd; // signed distance value
    vec3 col; // color
    int side;
};

Surface getvox(const vec3 pos, const vec3 size)
{
    vec3 maxp = pos + size*0.5;
    vec3 minp = pos - size*0.5;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    vec3 p;
    float t;

    Surface return_val;
    return_val.col = vec3(0.75);
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

Surface occSurface(Surface s1, Surface s2)
{
    // if(s1.sd == MAXSD) return s2;

    if(s1.sd <= s2.sd)
        return s1;
    else
        return s2;
}

void main()
{
    // float time = iGlobalTime * 1.0;
    // vec2 uv = gl_FragCoord.xy / iResolution.xx;
    // gl_FragColor = vec4(0.15, 0.15, 0.15, 1.0);

    // // camdir.y += cos(time)*0.5;
    // // camdir.z += sin(time)*0.5;

    // // focaldist += cos(time);
    // // camdir = rotate(campos, camdir, 1.0);

    // // vec3 Projection_point = campos + focaldist*camdir;
    // // Projection_point.y += (0.5-uv.x)*camsize;
    // // Projection_point.z += (0.5-uv.y)*camsize;

    // // camdir = campos-Projection_point;

    // vec3 camtar = campos;

    // float cameraRadius = 10.;
    // camtar.x = cameraRadius * cos(iTime) + campos.x; // convert x-component to polar and add offset 
    // camtar.z = cameraRadius * sin(iTime) + campos.z; // convert z-component to polar and add offset

    // camdir = camera(camtar, camdir) * normalize(vec3(uv, -1));;

    // if(int(gl_FragCoord.x)%2 == 0) discard;
    // if(int(gl_FragCoord.y)%2 == 0) discard;

    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    mouseUV.x += iTime*0.01;
    vec3 backgroundColor = vec3(0.835, 1, 1);

    vec3 col = vec3(0);
    vec3 lp = vec3(0, 0, 0); // lookat point (aka camera target)
    vec3 ro = vec3(3, 10, 1); // ray origin that represents camera position



    float cameraRadius = 5.0;
    ro.yz = ro.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    ro.xz = ro.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(lp.x, lp.z);
    
    // lp = cameraPos+rd;

    vec3 rd = camera(ro, lp) * normalize(vec3(uv, -1)); // ray direction

    campos = ro;
    camdir = rd;
    icamdir = 1.0/camdir;

    // gl_FragColor = vec4(0.15, 0.15, 0.15, 1.0);

    // vec3 lp = vec3(0, 0, 0);

    // vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    // float cameraRadius = 2.;
    // camdir.yz = camdir.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    // camdir.xz = camdir.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(camdir.x, camdir.z);

    // float time = iGlobalTime * 1.0;
    // vec2 uv = gl_FragCoord.xy/iResolution.xx;
    // camdir.y += cos(time)*0.5;
    // camdir.z += sin(time)*0.5;
    // campos.y += (0.5-uv.x)*camsize;
    // campos.z += (0.5-uv.y)*camsize;


    ivec3 s = ivec3(13); 
    Surface big_voxel = getvox(
                                vec3( // pos
                                    0,  
                                    0, 
                                    0
                                    ), 
                                vec3( // size
                                    s.x*2 -1, 
                                    s.y*2 -1, 
                                    s.z*2 -1
                                    ));

    if(big_voxel.sd == MAXSD) discard;


    Surface voxel;
    Surface newvoxel;
    voxel.sd  = MAXSD;
    voxel.col = vec3(0.0, 0.5, 0.5);

    // 11 : 13 ms
    // 11 : 95 fps 10-11 ms
    // 11 : 100 fps 9-10 ms
    // 11 : 144 fps 7 ms => cap atteint

    // 13 : 102 fps 10-9 ms

    for(int z = 0; z < s.z; z++)
    {
        for(int y = 0; y < s.y; y++)
        {
            for(int x = 0; x < s.x; x++)
            {
                newvoxel = getvox(
                vec3(
                    float(x*2 - s.x) + 1.0,  
                    float(y*2 - s.y) + 1.0, 
                    float(z*2 - s.z) + 1.0), 
                vec3(1.0, 1.0, 1.0));

                if(newvoxel.sd < voxel.sd) 
                    voxel = newvoxel;
            }
        }
    }

    gl_FragColor.rgb = voxel.col;

    vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
    switch(voxel.side)
    {
        case voxside_x : gl_FragColor *= voxside_colodr.x; break;
        case voxside_y : gl_FragColor *= voxside_colodr.y; break;
        case voxside_z : gl_FragColor *= voxside_colodr.z; break;
    }

    gl_FragColor.a = 1.0;
}
