

vec3 camdir = vec3(1.f, 0.0, 1.0);
vec3 campos = vec3(-5.f, 0.0, -5.0);
float camsize = 1.0;

int getvox(vec2 uv)
{
    campos.y += (0.5-uv.x)*camsize;
    campos.z += (0.5-uv.y)*camsize;

    vec3 maxp = vec3(1, 1, 1);
    vec3 minp = vec3(0, 0, 0);

    float halflen = 0.5;

    vec3 p;
    float t;
    float dist = 0.0;

    int return_val = 0; 


    //////////////// X //////////////
    t = (minp.x-campos.x)/camdir.x;
    p.yz = campos.yz + t*camdir.yz;

    if(p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        if(abs(t) > dist)
        {
            return_val = 1;
            dist = abs(t);
        }
    }


    t = (maxp.x-campos.x)/camdir.x;
    p.yz = campos.yz + t*camdir.yz;

    if(p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        if(abs(t) > dist)
        {
            return_val = 1;
            dist = abs(t);
        }
    }


    //////////////// Y //////////////
    t = (minp.y-campos.y)/camdir.y;
    p.xz = campos.xz + t*camdir.xz;

    if(p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        if(abs(t) > dist)
        {
            return_val = 2;
            dist = abs(t);
        }
    }


    t = (maxp.y-campos.y)/camdir.y;
    p.xz = campos.xz + t*camdir.xz;
    if(p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        if(abs(t) > dist)
        {
            return_val = 2;
            dist = abs(t);
        }
    }


    //////////////// Z //////////////
    t = (minp.z-campos.z)/camdir.z;
    p.xy = campos.xy + t*camdir.xy;

    if(p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        if(abs(t) > dist)
        {
            return_val = 4;
            dist = abs(t);
        }
    }


    t = (maxp.z-campos.z)/camdir.z;
    p.xy = campos.xy + t*camdir.xy;
    if(p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        if(abs(t) > dist)
        {
            return_val = 4;
            dist = abs(t);
        }
    }

    return return_val;
}

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}


vec3 rotate(vec3 v, vec3 axis, float angle)
{
  return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
}

void main()
{
    float time = iGlobalTime * 1.0;
    vec2 uv = (gl_FragCoord.xy / iResolution.xx - 0.5) * 8.0;
    gl_FragColor = vec4(0.15, 0.15, 0.15, 1.0);


    camdir.y += cos(time)*0.25;
    camdir.z += sin(time)*0.25;

    // mat3 rotmat = rotationMatrix(camdir, 2.5);
    camdir = rotate(campos, camdir, 2.5);

    int voxel = getvox(uv);

    if((voxel&1) != 0)
    {
        gl_FragColor.b += 0.5;
    }

    if((voxel&2) != 0)
    {
        gl_FragColor.r += 0.5;
    }

    if((voxel&4) != 0)
    {
        gl_FragColor.g += 0.5;
    }
}
